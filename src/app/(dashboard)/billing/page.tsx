"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PricingCards } from "@/components/PricingCards";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { TIERS } from "@/lib/constants";
import type { Tier } from "@/types";

interface BillingInfo {
  tier: Tier;
  trialEndsAt: string | null;
  isTrialActive: boolean;
  sheetsConnected: boolean;
}

export default function BillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const usageRes = await fetch("/api/usage");
      if (!usageRes.ok) throw new Error("Failed to fetch billing info");
      const usageJson = await usageRes.json();

      // Also get profile for sheets info
      const userRes = await fetch("/api/user");
      if (!userRes.ok) throw new Error("Failed to fetch profile");
      const userJson = await userRes.json();

      setBilling({
        tier: usageJson.data.tier,
        trialEndsAt: usageJson.data.trialEndsAt,
        isTrialActive: usageJson.data.isTrialActive,
        sheetsConnected: userJson.data?.sheetsConnected ?? false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  // Check for success/cancel query params from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast("Subscription updated successfully!", "success");
      fetchBilling();
      // Clean URL
      router.replace("/billing");
    }
    if (params.get("canceled") === "true") {
      toast("Checkout was cancelled.", "info");
      router.replace("/billing");
    }
  }, [router, toast, fetchBilling]);

  const handleUpgrade = async (priceId: string) => {
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode: "subscription" }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = json.data.url;
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to start checkout",
        "error"
      );
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);

    try {
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to open customer portal");
      }

      window.location.href = json.data.url;
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to open portal",
        "error"
      );
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" label="Loading billing info…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
        <p className="mb-3 text-sm text-red-700 dark:text-red-400">{error}</p>
        <Button variant="secondary" size="sm" onClick={fetchBilling}>
          Try again
        </Button>
      </div>
    );
  }

  const currentTierInfo = TIERS[billing?.tier ?? "free"];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Billing
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan Info */}
      {billing && (
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Current Plan
              </p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
                {currentTierInfo.label}
              </h2>

              {billing.isTrialActive && billing.trialEndsAt && (
                <p className="mt-1 text-sm text-kernel-600">
                  Trial ends {formatDate(billing.trialEndsAt)}
                </p>
              )}

              {billing.tier === "free" && !billing.isTrialActive && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {currentTierInfo.monthlyReceiptLimit} receipts per month
                </p>
              )}

              {(billing.tier === "starter" || billing.tier === "pro") && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {billing.tier === "starter"
                    ? "250 receipts per month"
                    : "Unlimited receipts"}{" "}
                  &middot;{" "}
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="text-kernel-600 hover:text-kernel-700"
                  >
                    {portalLoading ? "Loading…" : "Manage via Stripe"}
                  </button>
                </p>
              )}
            </div>

            {billing.isTrialActive && (
              <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Trial
              </span>
            )}
          </div>

          {/* Usage info */}
          <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Receipt limit
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-50">
                {currentTierInfo.monthlyReceiptLimit >= 999_999
                  ? "Unlimited"
                  : `${currentTierInfo.monthlyReceiptLimit}/month`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Sheet export
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-50">
                {currentTierInfo.hasSheetExport ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Insights
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-50">
                {currentTierInfo.hasInsights ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      {billing && (
        <PricingCards
          currentTier={billing.tier}
          isTrialActive={billing.isTrialActive}
          trialEndsAt={billing.trialEndsAt}
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  );
}
