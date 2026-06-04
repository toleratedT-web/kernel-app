"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TIERS } from "@/lib/constants";
import type { Tier } from "@/types";

export interface PricingCardsProps {
  currentTier: Tier;
  isTrialActive: boolean;
  trialEndsAt: string | null;
  onUpgrade: (priceId: string) => void;
}

export function PricingCards({
  currentTier,
  isTrialActive,
  trialEndsAt,
  onUpgrade,
}: PricingCardsProps) {
  const [annual, setAnnual] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const tiers = [TIERS.free, TIERS.starter, TIERS.pro];

  const handleUpgrade = async (tier: Tier) => {
    if (tier === "free") return;

    const priceId = annual
      ? TIERS[tier].stripePriceIdYearly
      : TIERS[tier].stripePriceIdMonthly;

    if (!priceId) {
      console.error(`No Stripe price ID for ${tier} ${annual ? "yearly" : "monthly"}`);
      return;
    }

    setLoadingTier(tier);

    try {
      await onUpgrade(priceId);
    } finally {
      setLoadingTier(null);
    }
  };

  const isCurrent = (tier: Tier) => {
    if (isTrialActive) return false;
    return currentTier === tier;
  };

  const isDowngrade = (tier: Tier) => {
    if (isTrialActive) return false;
    const order: Tier[] = ["free", "starter", "pro"];
    return order.indexOf(tier) < order.indexOf(currentTier);
  };

  return (
    <div>
      {/* Toggle */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <span
          className={`text-sm ${!annual ? "font-semibold text-gray-900 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"}`}
        >
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            annual ? "bg-kernel-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
          role="switch"
          aria-checked={annual}
          aria-label="Toggle annual billing"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              annual ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span
          className={`text-sm ${annual ? "font-semibold text-gray-900 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"}`}
        >
          Annual
          <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Save up to 20%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => {
          const price = annual ? tier.priceYearly : tier.priceMonthly;
          const priceLabel = tier.name === "free" ? "Free" : `$${(price / 100).toFixed(0)}`;
          const periodLabel = tier.name === "free" ? "" : annual ? "/year" : "/month";
          const active = isCurrent(tier.name);
          const downgrade = isDowngrade(tier.name);

          return (
            <div
              key={tier.name}
              className={`relative rounded-xl border p-6 ${
                active
                  ? "border-kernel-500 bg-kernel-50 dark:bg-kernel-950"
                  : tier.name === "starter"
                  ? "border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-900"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              }`}
            >
              {tier.name === "starter" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-kernel-600 px-3 py-1 text-xs font-medium text-white">
                  Popular
                </div>
              )}

              <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                {tier.label}
              </h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                  {priceLabel}
                </span>
                {periodLabel && (
                  <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                    {periodLabel}
                  </span>
                )}
              </div>

              <ul className="mb-6 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg
                    className="h-4 w-4 shrink-0 text-green-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {tier.monthlyReceiptLimit >= 999_999
                    ? "Unlimited receipts"
                    : `${tier.monthlyReceiptLimit} receipts/month`}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg
                    className={`h-4 w-4 shrink-0 ${
                      tier.hasInsights
                        ? "text-green-500"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                  Spending insights
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg
                    className="h-4 w-4 shrink-0 text-green-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Sheet export
                </li>
              </ul>

              {active ? (
                <div className="w-full rounded-lg bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Current plan
                </div>
              ) : (
                <Button
                  variant={tier.name === "starter" ? "primary" : "secondary"}
                  className="w-full"
                  onClick={() => handleUpgrade(tier.name)}
                  loading={loadingTier === tier.name}
                  disabled={downgrade}
                >
                  {isTrialActive
                    ? "Upgrade"
                    : downgrade
                    ? "Contact support"
                    : "Upgrade"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
