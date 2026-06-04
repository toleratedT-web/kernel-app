// ============================================================================
// Kernel — GET /api/usage
// ============================================================================
// Get current month usage, tier info, and trial status.
// Used by the frontend to show usage meters and enforce limits.

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth-helpers";
import { getTierLimits } from "@/lib/stripe";
import { getCurrentMonthKey } from "@/lib/utils";
import type { Tier } from "@/types";

export async function GET() {
  try {
    const { userId, profile, supabase } = await authenticateRequest();

    const monthKey = getCurrentMonthKey();

    // Get current month usage
    const { data: usage } = await supabase
      .from("monthly_usage")
      .select("receipt_count")
      .eq("user_id", userId)
      .eq("month", monthKey)
      .maybeSingle();

    const count = usage?.receipt_count ?? 0;

    // Determine effective tier (trial overrides)
    const isTrialActive =
      profile.trialEndsAt !== null &&
      new Date(profile.trialEndsAt) > new Date();

    const effectiveTier: Tier = isTrialActive ? "pro" : profile.tier;
    const { monthlyReceiptLimit, hasInsights } = getTierLimits(effectiveTier);
    const remaining = Math.max(0, monthlyReceiptLimit - count);
    const isOverLimit = remaining <= 0;

    return successResponse({
      count,
      limit: monthlyReceiptLimit,
      remaining,
      tier: profile.tier,
      effectiveTier,
      isOverLimit,
      isTrialActive,
      trialEndsAt: profile.trialEndsAt,
      hasInsights,
      month: monthKey,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Usage fetch error:", error);
    return errorResponse("An unexpected error occurred.", 500);
  }
}
