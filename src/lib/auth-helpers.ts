// ============================================================================
// Kernel — API Auth Helpers
// ============================================================================
// Shared utilities for API route handlers to authenticate requests,
// check tier limits, and return consistent error responses.

import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getTierLimits } from "@/lib/stripe";
import { getCurrentMonthKey } from "@/lib/utils";
import type { Tier, Profile } from "@/types";

/**
 * Authenticate the current request and return the user profile.
 * Throws a NextResponse redirect/error on auth failure.
 */
export async function authenticateRequest(): Promise<{
  userId: string;
  profile: Profile;
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>;
}> {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw NextResponse.json(
      { error: "Profile not found." },
      { status: 404 }
    );
  }

  return {
    userId: user.id,
    profile: mapProfileRow(profile),
    supabase,
  };
}

/**
 * Check if the user is within their tier's receipt limit for the current month.
 * Returns the usage info or throws a 403 error.
 */
export async function checkReceiptLimit(
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>,
  userId: string,
  tier: Tier,
  trialEndsAt: string | null
): Promise<{ count: number; limit: number; remaining: number }> {
  // Check trial
  const isTrialActive =
    trialEndsAt !== null && new Date(trialEndsAt) > new Date();

  // Determine effective tier for limit checking
  const effectiveTier: Tier = isTrialActive ? "pro" : tier;
  const { monthlyReceiptLimit } = getTierLimits(effectiveTier);

  // Get current month usage
  const monthKey = getCurrentMonthKey();

  const { data: usage } = await supabase
    .from("monthly_usage")
    .select("receipt_count")
    .eq("user_id", userId)
    .eq("month", monthKey)
    .maybeSingle();

  const count = usage?.receipt_count ?? 0;
  const remaining = monthlyReceiptLimit - count;

  if (remaining <= 0) {
    throw NextResponse.json(
      {
        error: `You've reached your monthly receipt limit (${monthlyReceiptLimit}). Upgrade your plan to scan more receipts.`,
        usage: { count, limit: monthlyReceiptLimit, remaining: 0 },
        upgradeUrl: "/pricing",
      },
      { status: 403 }
    );
  }

  return { count, limit: monthlyReceiptLimit, remaining };
}

/**
 * Map a database profile row to our application Profile type.
 */
function mapProfileRow(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: (row.email as string) ?? null,
    displayName: (row.display_name as string) ?? null,
    stripeCustomerId: (row.stripe_customer_id as string) ?? null,
    stripeSubscriptionId: (row.stripe_subscription_id as string) ?? null,
    tier: (row.tier as Tier) ?? "free",
    trialEndsAt: (row.trial_ends_at as string) ?? null,
    sheetsConnected: !!(row.sheets_token as Record<string, unknown>),
    sheetsEmail: (row.sheets_email as string) ?? null,
    sheetsSheetId: (row.sheets_sheet_id as string) ?? null,
    baseCurrency: (row.base_currency as string) ?? "GBP",
    createdAt: (row.created_at as string) ?? "",
    updatedAt: (row.updated_at as string) ?? "",
  };
}

/**
 * Create a JSON error response.
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { error: message, ...details },
    { status }
  );
}

/**
 * Create a JSON success response.
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json({ data }, { status });
}
