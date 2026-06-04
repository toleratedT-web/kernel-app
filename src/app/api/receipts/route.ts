// ============================================================================
// Kernel — /api/receipts
// ============================================================================
// GET  — List user's receipts (paginated, filterable)
// POST — Save a new receipt (used after quick-edit when scan was done separately)
//        Note: For MVP, the scan endpoint handles the full flow.

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth-helpers";

// ─── GET /api/receipts ─────────────────────────────────────────────────────
// Query params: page, per_page, search, merchant, date_from, date_to

export async function GET(request: Request) {
  try {
    const { userId, supabase } = await authenticateRequest();

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10))
    );
    const search = url.searchParams.get("search")?.trim();
    const merchant = url.searchParams.get("merchant")?.trim();
    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");

    // Build query
    let query = supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    const searchTerm = search || merchant;

    if (searchTerm) {
      query = query.ilike("merchant", `%${searchTerm}%`);
    }

    if (dateFrom) {
      query = query.gte("date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("date", dateTo);
    }

    // Get total count
    const countQuery = supabase
      .from("receipts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (searchTerm) {
      countQuery.ilike("merchant", `%${searchTerm}%`);
    }

    if (dateFrom) countQuery.gte("date", dateFrom);
    if (dateTo) countQuery.lte("date", dateTo);

    const { count: total } = await countQuery;

    // Fetch paginated data
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: receipts, error } = await query.range(from, to);

    if (error) {
      return errorResponse(`Failed to fetch receipts: ${error.message}`, 500);
    }

    // Map to camelCase
    const mapped = (receipts ?? []).map(mapReceipt);

    return successResponse({
      receipts: mapped,
      total: total ?? 0,
      page,
      perPage,
      totalPages: total ? Math.ceil(total / perPage) : 0,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("List receipts error:", error);
    return errorResponse("An unexpected error occurred.", 500);
  }
}

// ─── POST /api/receipts ────────────────────────────────────────────────────
// Save a new receipt (after quick-edit or manual creation)

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await authenticateRequest();

    const body = await request.json();

    // Validate required fields
    if (!body.merchant || !body.date) {
      return errorResponse(
        "Merchant and date are required.",
        400
      );
    }

    // Insert receipt
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        user_id: userId,
        image_url: body.imageUrl ?? null,
        image_storage_path: body.imageStoragePath ?? null,
        merchant: body.merchant,
        date: body.date,
        grand_total: body.grandTotal ?? null,
        currency: body.currency ?? "GBP",
        tax: body.tax ?? null,
        status: "edited",
      })
      .select()
      .single();

    if (receiptError || !receipt) {
      return errorResponse(
        `Failed to save receipt: ${receiptError?.message ?? "Unknown"}`,
        500
      );
    }

    // Insert items if provided
    let savedItems: Record<string, unknown>[] = [];

    if (Array.isArray(body.items) && body.items.length > 0) {
      const itemsToInsert = body.items.map(
        (item: Record<string, unknown>, index: number) => ({
          receipt_id: receipt.id,
          name: item.name,
          quantity: item.quantity ?? 1,
          unit_price: item.unitPrice ?? null,
          total_price: item.totalPrice ?? null,
          category: item.category ?? null,
          sort_order: index,
        })
      );

      const { data: items, error: itemsError } = await supabase
        .from("receipt_items")
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error("Failed to save items:", itemsError);
      } else {
        savedItems = items ?? [];
      }
    }

    return successResponse(
      {
        ...mapReceipt(receipt),
        items: savedItems.map(mapItem),
      },
      201
    );
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Create receipt error:", error);
    return errorResponse("An unexpected error occurred.", 500);
  }
}

// ─── Mapping helpers ───────────────────────────────────────────────────────

function mapReceipt(row: Record<string, unknown>): Record<string, unknown> {
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
    items: Array.isArray(row.receipt_items)
      ? (row as { receipt_items: Record<string, unknown>[] }).receipt_items.map(mapItem)
      : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItem(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    name: row.name,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalPrice: row.total_price,
    category: row.category,
    sortOrder: row.sort_order,
  };
}
