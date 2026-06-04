// ============================================================================
// Kernel — Supabase Browser Client
// ============================================================================
// Singleton browser client for client-side usage.
// Refreshes session automatically via cookies.

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Get or create a Supabase client for browser-side usage.
 * Uses NEXT_PUBLIC_* environment variables.
 */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
    );
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
