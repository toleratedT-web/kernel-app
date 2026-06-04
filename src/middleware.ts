// ============================================================================
// Kernel — Next.js Middleware
// ============================================================================
// Session management with Supabase auth middleware.
// Protects dashboard routes and redirects unauthenticated users.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Routes that require authentication.
 */
const PROTECTED_ROUTES = [
  "/scan",
  "/receipts",
  "/insights",
  "/settings",
  "/api/receipts",
  "/api/usage",
  "/api/categories",
  "/api/stripe/checkout",
  "/api/sheets",
  "/api/user",
];

/**
 * Routes that are only accessible to unauthenticated users.
 */
const AUTH_ONLY_ROUTES = ["/auth/login", "/auth/signup"];

/**
 * Stripe webhook needs raw body — skip middleware.
 * Also skip static files and Next.js internals.
 */
const SKIP_ROUTES = [
  "/api/stripe/webhook",
  "/_next",
  "/static",
  "/icons",
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and webhooks
  if (SKIP_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create a response and Supabase client in middleware context
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing Supabase environment variables in middleware."
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session and get user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthenticated = !!session?.user;

  // Skip auth checks on StackBlitz — client-side AuthGuard handles protection
  if (!isAuthenticated && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    return supabaseResponse;
  }

  if (isAuthenticated && AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/receipts", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, manifest, sw.js)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)",
  ],
};
