// ============================================================================
// Kernel — /api/user
// ============================================================================
// GET   — Get the authenticated user's profile
// PATCH — Update profile fields
//
// Returns camelCase profile matching the Profile type from @/types.

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth-helpers";
import type { Profile, Tier } from "@/types";

// ─── GET /api/user ──────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { userId, supabase } = await authenticateRequest();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return errorResponse("Profile not found.", 404);
    }

    const mapped: Profile = {
      id: profile.id,
      email: profile.email ?? null,
      displayName: profile.display_name ?? null,
      stripeCustomerId: profile.stripe_customer_id ?? null,
      stripeSubscriptionId: profile.stripe_subscription_id ?? null,
      tier: (profile.tier as Tier) ?? "free",
      trialEndsAt: profile.trial_ends_at ?? null,
      sheetsConnected: !!(profile.sheets_token as Record<string, unknown>),
      sheetsEmail: profile.sheets_email ?? null,
      sheetsSheetId: profile.sheets_sheet_id ?? null,
      baseCurrency: profile.base_currency ?? "GBP",
      createdAt: profile.created_at ?? "",
      updatedAt: profile.updated_at ?? "",
    };

    return successResponse(mapped);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Get profile error:", error);
    return errorResponse("An unexpected error occurred.", 500);
  }
}

// ─── PATCH /api/user ─────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  try {
    const { userId, supabase } = await authenticateRequest();

    const body = await request.json();

    // Build allowed updates
    const updates: Record<string, unknown> = {};

    if (body.displayName !== undefined) {
      updates.display_name = body.displayName;
    }

    if (body.baseCurrency !== undefined) {
      updates.base_currency = body.baseCurrency;
    }

    if (body.sheetsToken !== undefined) {
      updates.sheets_token = body.sheetsToken;
    }

    if (body.sheetsEmail !== undefined) {
      updates.sheets_email = body.sheetsEmail;
    }

    if (body.sheetsSheetId !== undefined) {
      updates.sheets_sheet_id = body.sheetsSheetId;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse("No valid fields to update.", 400);
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (updateError || !updated) {
      return errorResponse(
        `Failed to update profile: ${updateError?.message ?? "Unknown"}`,
        500
      );
    }

    const mapped: Profile = {
      id: updated.id,
      email: updated.email ?? null,
      displayName: updated.display_name ?? null,
      stripeCustomerId: updated.stripe_customer_id ?? null,
      stripeSubscriptionId: updated.stripe_subscription_id ?? null,
      tier: (updated.tier as Tier) ?? "free",
      trialEndsAt: updated.trial_ends_at ?? null,
      sheetsConnected: !!(updated.sheets_token as Record<string, unknown>),
      sheetsEmail: updated.sheets_email ?? null,
      sheetsSheetId: updated.sheets_sheet_id ?? null,
      baseCurrency: updated.base_currency ?? "GBP",
      createdAt: updated.created_at ?? "",
      updatedAt: updated.updated_at ?? "",
    };

    return successResponse(mapped);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Update profile error:", error);
    return errorResponse("An unexpected error occurred.", 500);
  }
}
