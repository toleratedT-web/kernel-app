// ============================================================================
// Kernel — Shared Utilities
// ============================================================================

/**
 * Format a number as currency string.
 *
 * @param amount - The numeric amount
 * @param currency - ISO 4217 currency code (default: GBP)
 * @returns Formatted currency string (e.g., "£12.50", "$12.50")
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "GBP"
): string {
  if (amount === null || amount === undefined) return "—";

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if currency code is unsupported
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a date string or Date into a human-readable format.
 *
 * @param date - Date string, Date object, or null
 * @returns Formatted date (e.g., "4 Jun 2026") or "—" if null
 */
export function formatDate(
  date: string | Date | null | undefined
): string {
  if (!date) return "—";

  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
}

/**
 * Format a date string to YYYY-MM-DD for HTML date inputs.
 */
export function formatDateInput(date: string | Date | null | undefined): string {
  if (!date) return "";

  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Get the current month key in YYYY-MM format.
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Generate a month key for a given date offset.
 *
 * @param offset - Months from now (negative for past)
 * @returns Month key (e.g., "2026-06")
 */
export function getMonthKey(offset: number = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Truncate a string to a maximum length, adding ellipsis if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/**
 * Generate a client-side unique ID (for local item keys before save).
 */
export function generateTempId(): string {
  return `temp_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Safely parse JSON, returning a default on failure.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
