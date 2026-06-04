"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/**
 * Client-side auth guard that shows a loading state while checking
 * authentication and redirects to login if not authenticated.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Listen for auth state changes (handles login redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setAuthenticated(true);
          setChecking(false);
        }
      }
    );

    // Also check current session (with retry for StackBlitz delay)
    let retries = 0;
    const checkSession = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setAuthenticated(true);
          setChecking(false);
        } else if (retries < 3) {
          retries++;
          setTimeout(checkSession, 1000);
        } else {
          router.replace("/auth/login");
          setChecking(false);
        }
      });
    };
    checkSession();

    return () => subscription?.unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" label="Checking authentication…" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
