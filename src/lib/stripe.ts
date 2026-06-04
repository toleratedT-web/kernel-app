// ============================================================================
// Kernel — Stripe Server Client & Helpers
// ============================================================================

import Stripe from "stripe";
import type { Tier } from "@/types";

let stripeClient: Stripe | null = null;

/**
 * Get or create a Stripe server-side client.
 */
export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing Stripe secret key: STRIPE_SECRET_KEY must be set.");
  }

  stripeClient = new Stripe(secretKey, {
    typescript: true,
  });

  return stripeClient;
}

/**
 * Map a Stripe price ID to a tier.
 * These IDs come from your Stripe dashboard products/prices.
 */
const PRICE_ID_TO_TIER: Record<string, Tier> = {
  // Monthly
  ...(process.env.STRIPE_PRICE_STARTER_MONTHLY
    ? { [process.env.STRIPE_PRICE_STARTER_MONTHLY]: "starter" as Tier }
    : {}),
  ...(process.env.STRIPE_PRICE_PRO_MONTHLY
    ? { [process.env.STRIPE_PRICE_PRO_MONTHLY]: "pro" as Tier }
    : {}),
  // Yearly
  ...(process.env.STRIPE_PRICE_STARTER_YEARLY
    ? { [process.env.STRIPE_PRICE_STARTER_YEARLY]: "starter" as Tier }
    : {}),
  ...(process.env.STRIPE_PRICE_PRO_YEARLY
    ? { [process.env.STRIPE_PRICE_PRO_YEARLY]: "pro" as Tier }
    : {}),
};

/**
 * Map a Stripe price ID to a tier.
 */
export function mapPriceIdToTier(priceId: string): Tier | null {
  return PRICE_ID_TO_TIER[priceId] ?? null;
}

/**
 * Get the tier-specific monthly receipt limit.
 */
export function getTierLimits(tier: Tier): {
  monthlyReceiptLimit: number;
  hasInsights: boolean;
} {
  switch (tier) {
    case "pro":
      return { monthlyReceiptLimit: 999_999, hasInsights: true };
    case "starter":
      return { monthlyReceiptLimit: 250, hasInsights: true };
    case "free":
    default:
      return { monthlyReceiptLimit: 10, hasInsights: false };
  }
}

/**
 * Stripe price configuration for reference.
 */
export const PRICING = {
  starter: {
    monthly: {
      priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
      amount: 500, // $5.00
    },
    yearly: {
      priceId: process.env.STRIPE_PRICE_STARTER_YEARLY ?? "",
      amount: 4500, // $45.00
    },
  },
  pro: {
    monthly: {
      priceId: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
      amount: 1000, // $10.00
    },
    yearly: {
      priceId: process.env.STRIPE_PRICE_PRO_YEARLY ?? "",
      amount: 8400, // $84.00
    },
  },
} as const;
