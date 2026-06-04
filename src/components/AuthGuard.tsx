"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (done.current) return;
      if (session?.user) {
        done.current = true;
        setAuthenticated(true);
        setChecking(false);
      } else {
        // Not logged in, redirect
        router.replace("/auth/login");
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" label="Checking authentication…" />
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
