// ============================================================================
// Kernel — Supabase Admin Client
// ============================================================================
// Admin client using the service_role key for admin operations:
// - Stripe webhook handlers (update profile tier)
// - Admin-only operations
// WARNING: Service role bypasses RLS. Never expose to the client.

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/**
 * Get or create a Supabase admin client using the service role key.
 * Bypasses RLS — use only in trusted server-side contexts (webhooks, admin).
 */
export function getAdminSupabaseClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
