// ============================================================================
// Kernel — POST /api/receipts/[id]/export
// ============================================================================
// Export receipt items to the user's Google Sheet.
// Flow:
//   1. Authenticate user
//   2. Check user has connected Google Sheets
//   3. Fetch receipt + items
//   4. Append items to Google Sheet via API
//   5. Update receipt status to 'exported'

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth-helpers";
import { appendReceiptToSheet } from "@/lib/sheets";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, profile, supabase } = await authenticateRequest();

    // 1. Check Google Sheets is connected
    if (!profile.sheetsConnected || !profile.sheetsSheetId) {
      return errorResponse(
        "Google Sheets not connected. Connect your Google account in Settings first.",
        400
      );
    }

    // 2. Fetch receipt with items, verify ownership
    const { data: receipt, error: fetchError } = await supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !receipt) {
      return errorResponse("Receipt not found.", 404);
    }

    // 3. Get the stored OAuth token for Google Sheets
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("sheets_token")
      .eq("id", userId)
      .single();

    if (profileError || !profileData?.sheets_token) {
      return errorResponse(
        "Google Sheets token not found. Reconnect your Google account.",
        400
      );
    }

    // 4. Map items for export
    const items = (
      receipt.receipt_items as Array<Record<string, unknown>>
    ).map((item) => ({
      name: item.name as string,
      quantity: (item.quantity as number) ?? 1,
      unitPrice: (item.unit_price as number) ?? null,
      totalPrice: (item.total_price as number) ?? null,
      category: (item.category as string) ?? null,
    }));

    if (items.length === 0) {
      return errorResponse("No items to export. Add line items first.", 400);
    }

    // 5. Export to Google Sheets
    const { sheetUrl } = await appendReceiptToSheet(
      profileData.sheets_token as {
        access_token: string;
        refresh_token?: string;
        scope: string;
        token_type: string;
        expiry_date: number;
      },
      profile.sheetsSheetId,
      (receipt.merchant as string) ?? "Unknown Merchant",
      (receipt.date as string) ?? new Date().toISOString().split("T")[0],
      items,
      (receipt.currency as string) ?? "GBP"
    );

    // 6. Update receipt status
    await supabase
      .from("receipts")
      .update({
        status: "exported",
        exported_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    return successResponse({
      success: true,
      sheetUrl,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Export to Sheets error:", error);

    // Check for Google Sheets API errors
    const err = error as Error;
    if (err.message?.includes("Sheets")) {
      return errorResponse(err.message, 502);
    }

    return errorResponse(
      "Failed to export to Google Sheets. Please try again.",
      500
    );
  }
}
