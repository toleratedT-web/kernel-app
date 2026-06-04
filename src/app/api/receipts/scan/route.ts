// ============================================================================
// Kernel — POST /api/receipts/scan
// ============================================================================
// Upload receipt image → Gemini OCR → parse items → store in DB.
// Flow:
//   1. Authenticate user
//   2. Check tier/receipt limit
//   3. Validate and process uploaded image
//   4. Send to Gemini 2.5 Flash Lite for OCR
//   5. Parse response into structured data
//   6. Save receipt + items to Supabase
//   7. Increment monthly usage
//   8. Return saved receipt

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  checkReceiptLimit,
  errorResponse,
} from "@/lib/auth-helpers";
import { parseReceiptImage } from "@/lib/gemini";
import { getCurrentMonthKey } from "@/lib/utils";
import { STORAGE } from "@/lib/constants";
import type { Receipt, ReceiptItem, GeminiReceiptData } from "@/types";

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const { userId, profile, supabase } = await authenticateRequest();

    // 2. Check receipt limit before spending API cost on Gemini
    await checkReceiptLimit(
      supabase,
      userId,
      profile.tier,
      profile.trialEndsAt
    );

    // 3. Parse form data
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return errorResponse("No image file provided. Attach a receipt image.", 400);
    }

    // Validate file size (10 MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (imageFile.size > MAX_SIZE) {
      return errorResponse("Image too large. Maximum size is 10 MB.", 400);
    }

    // Validate MIME type
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(imageFile.type)) {
      return errorResponse(
        "Unsupported file format. Use JPEG, PNG, or WebP.",
        400
      );
    }

    // 4. Convert image to base64 for Gemini
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageBase64 = imageBuffer.toString("base64");

    // 5. Call Gemini OCR
    const geminiData = await parseReceiptImage(imageBase64, imageFile.type);

    if (!geminiData || geminiData.items.length === 0) {
      return errorResponse(
        "Could not read this receipt. Try a clearer photo with better lighting.",
        422
      );
    }

    // 6. Upload image to Supabase Storage
    const fileName = `${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = STORAGE.getPath(userId, fileName);

    const { error: uploadError } = await supabase.storage
      .from("receipt-images")
      .upload(storagePath, imageBuffer, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Image upload failed:", uploadError);
      // Continue anyway — the OCR data is more important than the image
    }

    // Get public URL for the image
    const { data: urlData } = supabase.storage
      .from("receipt-images")
      .getPublicUrl(storagePath);

    const imageUrl = uploadError ? null : (urlData?.publicUrl ?? null);

    // 7. Save receipt to database
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        user_id: userId,
        image_url: imageUrl,
        image_storage_path: uploadError ? null : storagePath,
        merchant: geminiData.merchant,
        date: geminiData.date,
        grand_total: geminiData.grandTotal,
        currency: geminiData.currency ?? "GBP",
        tax: geminiData.tax,
        raw_ocr: geminiData as unknown as Record<string, unknown>,
        status: "pending",
      })
      .select()
      .single();

    if (receiptError || !receipt) {
      return errorResponse(
        `Failed to save receipt: ${receiptError?.message ?? "Unknown error"}`,
        500
      );
    }

    // 8. Save receipt items
    const itemsToInsert = geminiData.items.map((item, index) => ({
      receipt_id: receipt.id,
      name: item.name,
      quantity: item.quantity ?? 1,
      unit_price: item.unitPrice,
      total_price: item.totalPrice ?? (item.unitPrice ? item.quantity ?? 1 * item.unitPrice : null),
      sort_order: index,
    }));

    const { data: savedItems, error: itemsError } = await supabase
      .from("receipt_items")
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.error("Failed to save receipt items:", itemsError);
      // Receipt was created; items missing is a partial failure
    }

    // 9. Increment monthly usage
    const monthKey = getCurrentMonthKey();

    const { error: usageError } = await supabase.rpc(
      "increment_monthly_usage",
      {
        p_user_id: userId,
        p_month: monthKey,
      }
    );

    if (usageError) {
      console.error("Failed to increment monthly usage:", usageError);
      // Non-fatal — receipt is already saved
    }

    // 10. Build response
    const mapped: Receipt = {
      id: receipt.id,
      userId: receipt.user_id,
      imageUrl: receipt.image_url,
      imageStoragePath: receipt.image_storage_path,
      merchant: receipt.merchant,
      date: receipt.date,
      grandTotal: receipt.grand_total,
      currency: receipt.currency,
      tax: receipt.tax,
      rawOcr: receipt.raw_ocr,
      status: receipt.status,
      exportedAt: receipt.exported_at,
      items: (savedItems ?? []).map(
        (item: Record<string, unknown>): ReceiptItem => ({
          id: item.id as string,
          receiptId: item.receipt_id as string,
          name: item.name as string,
          quantity: (item.quantity as number) ?? 1,
          unitPrice: (item.unit_price as number) ?? null,
          totalPrice: (item.total_price as number) ?? null,
          category: (item.category as string) ?? null,
          sortOrder: (item.sort_order as number) ?? 0,
        })
      ),
      createdAt: receipt.created_at,
      updatedAt: receipt.updated_at,
    };

    return NextResponse.json({ data: mapped }, { status: 201 });
  } catch (error) {
    // Handle auth errors (NextResponse throws)
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("Receipt scan error:", error);

    if (error instanceof Error) {
      // Check for Gemini-specific errors
      const geminiErr = error as Error & { code?: string };
      if (geminiErr.code) {
        return NextResponse.json(
          { error: geminiErr.message, code: geminiErr.code },
          { status: 502 }
        );
      }
    }

    return errorResponse("An unexpected error occurred while processing the receipt.", 500);
  }
}
