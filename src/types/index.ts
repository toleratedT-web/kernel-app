// ============================================================================
// Kernel — Application Types & Interfaces
// ============================================================================

export type Tier = "free" | "starter" | "pro";
export type ReceiptStatus = "pending" | "edited" | "exported";
export type SubscriptionStatus = "incomplete" | "active" | "past_due" | "canceled" | "unpaid" | "trialing";

// ─── Profile ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string | null;
  displayName: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  tier: Tier;
  trialEndsAt: string | null;
  sheetsConnected: boolean;
  sheetsEmail: string | null;
  sheetsSheetId: string | null;
  baseCurrency: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Receipt ────────────────────────────────────────────────────────────────

export interface Receipt {
  id: string;
  userId: string;
  imageUrl: string | null;
  imageStoragePath: string | null;
  merchant: string | null;
  date: string | null;
  grandTotal: number | null;
  currency: string;
  tax: number | null;
  rawOcr: Record<string, unknown> | null;
  status: ReceiptStatus;
  exportedAt: string | null;
  items: ReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  name: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  category: string | null;
  sortOrder: number;
}

// ─── Gemini OCR ─────────────────────────────────────────────────────────────

export interface GeminiReceiptData {
  merchant: string | null;
  date: string | null; // YYYY-MM-DD
  items: GeminiLineItem[];
  tax: number | null;
  grandTotal: number | null;
  currency: string | null;
}

export interface GeminiLineItem {
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
}

// ─── Usage & Tiers ──────────────────────────────────────────────────────────

export interface MonthlyUsage {
  count: number;
  limit: number;
  tier: Tier;
  trialEndsAt: string | null;
  isTrialActive: boolean;
  isOverLimit: boolean;
  remaining: number;
}

export interface TierInfo {
  name: Tier;
  label: string;
  monthlyReceiptLimit: number;
  hasInsights: boolean;
  hasSheetExport: boolean;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
}

// ─── Categories ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  color: string | null;
  keywords: string[] | null;
  icon: string | null;
  isSystem: boolean;
}

// ─── API Responses ──────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ScanResponse {
  receipt: Receipt;
}

export interface ExportResponse {
  success: boolean;
  sheetUrl?: string;
}

export interface CheckoutResponse {
  url: string;
}

// ─── Stripe ─────────────────────────────────────────────────────────────────

export interface StripePrice {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
  interval: "month" | "year";
  tier: Tier;
}

// ─── Google Sheets ──────────────────────────────────────────────────────────

export interface SheetsToken {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface SheetsConnectState {
  redirectTo: string;
}
