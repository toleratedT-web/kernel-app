// ============================================================================
// Kernel — GET /auth/callback
// ============================================================================
// Supabase Auth callback handler.
// After email confirmation or OAuth, Supabase redirects here.
// Exchanges auth code for session and redirects to dashboard.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Get the auth code from query params
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/receipts";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      let response = NextResponse.redirect(`${origin}${next}`);

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.redirect(`${origin}${next}`);
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);
      return response;
    }
  }

  // No code — redirect to login
  return NextResponse.redirect(`${origin}/auth/login?error=No auth code provided`);
}
