// ============================================================================
// Kernel — Database Row Types (Supabase manual equivalents)
// ============================================================================

/**
 * Maps to public.profiles table.
 * Profiles extend auth.users with subscription info, preferences, and OAuth tokens.
 */
export interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: "free" | "starter" | "pro";
  trial_ends_at: string | null;
  sheets_token: Record<string, unknown> | null;
  sheets_email: string | null;
  sheets_sheet_id: string | null;
  base_currency: string;
  created_at: string;
  updated_at: string;
}

/**
 * Maps to public.receipts table.
 * One row per receipt scan — stores metadata and raw OCR output.
 */
export interface ReceiptRow {
  id: string;
  user_id: string;
  image_url: string | null;
  image_storage_path: string | null;
  merchant: string | null;
  date: string | null;
  grand_total: number | null;
  currency: string;
  tax: number | null;
  raw_ocr: Record<string, unknown> | null;
  status: "pending" | "edited" | "exported";
  exported_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Maps to public.receipt_items table.
 * Individual line items extracted by Gemini.
 */
export interface ReceiptItemRow {
  id: string;
  receipt_id: string;
  name: string;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  category: string | null;
  sort_order: number;
}

/**
 * Maps to public.monthly_usage table.
 * Tracks receipt count per user per month for tier enforcement.
 */
export interface MonthlyUsageRow {
  id: string;
  user_id: string;
  month: string; // 'YYYY-MM'
  receipt_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Maps to public.categories table.
 * Predefined system categories + user-created custom categories.
 */
export interface CategoryRow {
  id: string;
  user_id: string | null;
  name: string;
  color: string | null;
  keywords: string[] | null;
  icon: string | null;
  is_system: boolean;
  created_at: string;
}

/**
 * Maps to public.subscriptions table.
 * Audit trail of subscription changes.
 */
export interface SubscriptionRow {
  id: string;
  profile_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: "incomplete" | "active" | "past_due" | "canceled" | "unpaid" | "trialing";
  tier: "free" | "starter" | "pro";
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase storage object reference.
 */
export interface StorageObject {
  name: string;
  bucket_id: string;
  owner: string;
  created_at: string;
  updated_at: string;
  id: string;
  metadata: Record<string, unknown>;
}
