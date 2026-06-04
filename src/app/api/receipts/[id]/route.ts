// ============================================================================
// Kernel — /api/receipts/[id]
// ============================================================================
// GET    — Get single receipt with items
// PUT    — Update receipt (edit merchant, date, items)
// DELETE — Delete receipt and its storage image

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth-helpers";

// ─── GET /api/receipts/[id] ────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, supabase } = await authenticateRequest();

    const { data: receipt, error } = await supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (error || !receipt) {
      if (error?.code === "PGRST116") {
        return errorResponse("Receipt not found.", 404);
      }
      return errorResponse(
        `Failed to fetch receipt: ${error?.message ?? "Not found"}`,
        404
      );
    }

    return successResponse(mapReceiptDetail(receipt));
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Get receipt error:", error);
    return errorResponse("An unexpected error occurred.", 500);
  }
}

// ─── PUT /api/receipts/[id] ────────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, supabase } = await authenticateRequest();

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("receipts")
      .select("id, image_storage_path, status")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      return errorResponse("Receipt not found.", 404);
    }

    const body = await request.json();

    // Update receipt fields
    const updates: Record<string, unknown> = {};
    if (body.merchant !== undefined) updates.merchant = body.merchant;
    if (body.date !== undefined) updates.date = body.date;
    if (body.grandTotal !== undefined) updates.grand_total = body.grandTotal;
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.tax !== undefined) updates.tax = body.tax;
    if (body.imageUrl !== undefined) updates.image_url = body.imageUrl;

    // Always set status to 'edited' on manual update
    updates.status = "edited";

    const { data: updated, error: updateError } = await supabase
      .from("receipts")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (updateError || !updated) {
      return errorResponse(
        `Failed to update receipt: ${updateError?.message ?? "Unknown"}`,
        500
      );
    }

    // Update items if provided (delete all and re-insert)
    if (Array.isArray(body.items)) {
      // Delete existing items
      await supabase
        .from("receipt_items")
        .delete()
        .eq("receipt_id", params.id);

      // Insert new items
      if (body.items.length > 0) {
        const itemsToInsert = body.items.map(
          (item: Record<string, unknown>, index: number) => ({
            receipt_id: params.id,
            name: item.name,
            quantity: item.quantity ?? 1,
            unit_price: item.unitPrice ?? null,
            total_price: item.totalPrice ?? null,
            category: item.category ?? null,
            sort_order: index,
          })
        );

        await supabase.from("receipt_items").insert(itemsToInsert);
      }
    }

    // Fetch the final state with items
    const { data: finalReceipt } = await supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("id", params.id)
      .single();

    return successResponse(mapReceiptDetail(finalReceipt ?? updated));
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Update receipt error:", error);
    return errorResponse("An unexpected error occurred.", 500);
  }
}

// ─── DELETE /api/receipts/[id] ─────────────────────────────────────────────

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, supabase } = await authenticateRequest();

    // Verify ownership and get storage path
    const { data: receipt, error: fetchError } = await supabase
      .from("receipts")
      .select("id, image_storage_path")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !receipt) {
      return errorResponse("Receipt not found.", 404);
    }

    // Delete the storage image if it exists
    if (receipt.image_storage_path) {
      await supabase.storage
        .from("receipt-images")
        .remove([receipt.image_storage_path]);
    }

    // Delete the receipt (items cascade via FK)
    const { error: deleteError } = await supabase
      .from("receipts")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      return errorResponse(
        `Failed to delete receipt: ${deleteError.message}`,
        500
      );
    }

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Delete receipt error:", error);
    return errorResponse("An unexpected error occurred.", 500);
  }
}

// ─── Mapping helpers ───────────────────────────────────────────────────────

function mapReceiptDetail(row: Record<string, unknown>): Record<string, unknown> {
  const items = Array.isArray(row.receipt_items)
    ? (row.receipt_items as Record<string, unknown>[]).map((item) => ({
        id: item.id,
        receiptId: item.receipt_id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        category: item.category,
        sortOrder: item.sort_order,
      }))
    : [];

  return {
    id: row.id,
    userId: row.user_id,
    imageUrl: row.image_url,
    imageStoragePath: row.image_storage_path,
    merchant: row.merchant,
    date: row.date,
    grandTotal: row.grand_total,
    currency: row.currency,
    tax: row.tax,
    rawOcr: row.raw_ocr,
    status: row.status,
    exportedAt: row.exported_at,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
