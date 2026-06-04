// ============================================================================
// Kernel — /api/categories
// ============================================================================
// GET  — List categories (system + user's custom categories)
// POST — Create a custom category

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth-helpers";

// ─── GET /api/categories ───────────────────────────────────────────────────

export async function GET() {
  try {
    const { userId, supabase } = await authenticateRequest();

    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order("is_system", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      return errorResponse(
        `Failed to fetch categories: ${error.message}`,
        500
      );
    }

    const mapped = (categories ?? []).map((cat: Record<string, unknown>) => ({
      id: cat.id,
      userId: cat.user_id,
      name: cat.name,
      color: cat.color,
      keywords: cat.keywords,
      icon: cat.icon,
      isSystem: cat.is_system,
    }));

    return successResponse({ categories: mapped });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("List categories error:", error);
    return errorResponse("An unexpected error occurred.", 500);
  }
}

// ─── POST /api/categories ──────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await authenticateRequest();

    const body = await request.json();

    // Validate
    if (!body.name || typeof body.name !== "string") {
      return errorResponse("Category name is required.", 400);
    }

    const name = body.name.trim();
    if (name.length < 1 || name.length > 50) {
      return errorResponse(
        "Category name must be between 1 and 50 characters.",
        400
      );
    }

    // Check duplicate (case-insensitive)
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .ilike("name", name)
      .maybeSingle();

    if (existing) {
      return errorResponse(
        "A category with this name already exists.",
        409
      );
    }

    // Create
    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name,
        color: body.color ?? null,
        icon: body.icon ?? null,
        keywords: Array.isArray(body.keywords) ? body.keywords : [],
        is_system: false,
      })
      .select()
      .single();

    if (error || !category) {
      return errorResponse(
        `Failed to create category: ${error?.message ?? "Unknown"}`,
        500
      );
    }

    return successResponse(
      {
        id: category.id,
        userId: category.user_id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        keywords: category.keywords,
        isSystem: category.is_system,
      },
      201
    );
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Create category error:", error);
    return errorResponse("An unexpected error occurred.", 500);
  }
}
