// ============================================================================
// Kernel — Marketing Landing Page (MVP placeholder)
// ============================================================================
// Redirects authenticated users to dashboard, shows landing to guests.

"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/receipts";
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kernel-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto max-w-3xl">
          {/* Logo */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <svg
              className="h-10 w-10 text-kernel-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Kernel
            </h1>
          </div>

          <h2 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-6xl">
            The kernel of your spending
          </h2>

          <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">
            Snap a receipt. AI extracts every line item. One tap to Google
            Sheets. See where your money actually goes.
          </p>

          <div className="flex items-center justify-center gap-4">
            <a
              href="/auth/signup"
              className="btn-primary text-base"
            >
              Get started free
            </a>
            <a
              href="/auth/login"
              className="btn-secondary text-base"
            >
              Sign in
            </a>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Free plan: 10 receipts/month. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-4 py-8 text-center dark:border-gray-800">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Kernel. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
