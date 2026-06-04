"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function AuthRedirect() {
  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        window.location.href = "/receipts";
      }
    });
  }, []);

  return null;
}
