// ============================================================================
// Kernel — App Constants (Tiers, Limits, Pricing)
// ============================================================================

import type { Tier, TierInfo } from "@/types";

/**
 * Tier definitions with limits and pricing info.
 * Stripe price IDs are read from environment variables.
 */
export const TIERS: Record<Tier, TierInfo> = {
  free: {
    name: "free",
    label: "Free",
    monthlyReceiptLimit: 10,
    hasInsights: false,
    hasSheetExport: true,
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
  },
  starter: {
    name: "starter",
    label: "Starter",
    monthlyReceiptLimit: 250,
    hasInsights: true,
    hasSheetExport: true,
    priceMonthly: 500, // $5.00
    priceYearly: 4500, // $45.00
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? null,
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY ?? null,
  },
  pro: {
    name: "pro",
    label: "Pro",
    monthlyReceiptLimit: 999_999, // effectively unlimited
    hasInsights: true,
    hasSheetExport: true,
    priceMonthly: 1000, // $10.00
    priceYearly: 8400, // $84.00
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? null,
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? null,
  },
};

/**
 * Trial configuration.
 */
export const TRIAL = {
  durationDays: 14,
  /** Trial tier is treated as "pro" for access purposes */
  accessTier: "pro" as Tier,
};

/**
 * Feature flags for MVP.
 */
export const FEATURES = {
  insights: false, // Phase 2 — disabled for MVP
  search: true, // Basic search enabled
  multiCurrency: false, // Phase 3 — disabled for MVP
  emailSummaries: false, // Phase 3 — disabled for MVP
};

/**
 * File upload limits.
 */
export const UPLOAD = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
};

/**
 * Receipt image storage path prefix.
 */
export const STORAGE = {
  bucketName: "receipt-images",
  /** Get the storage path for a user's receipt image */
  getPath: (userId: string, fileName: string) =>
    `${userId}/${fileName}`,
};

/**
 * Google Sheets export defaults.
 */
export const SHEETS = {
  sheetTitle: "Kernel",
  headerRow: [
    "Date",
    "Merchant",
    "Item",
    "Quantity",
    "Unit Price",
    "Total",
    "Category",
    "Currency",
  ] as const,
};

/**
 * Pagination defaults.
 */
export const PAGINATION = {
  defaultPerPage: 20,
  maxPerPage: 100,
};

/**
 * App metadata.
 */
export const APP = {
  name: "Kernel",
  tagline: "The kernel of your spending",
  description: "Snap a receipt. AI extracts every line item. One tap to Google Sheets.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
