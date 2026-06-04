// ============================================================================
// Kernel — Currency Conversion Rates Helper
// ============================================================================
// For MVP: uses hard-coded approximate rates.
// Post-MVP: can integrate with a free FX API (e.g., exchangerate-api.com).

/**
 * Fallback approximate exchange rates (relative to GBP).
 * Updated manually as needed for MVP.
 */
const FALLBACK_RATES: Record<string, number> = {
  GBP: 1,
  USD: 1.27,
  EUR: 1.17,
  CAD: 1.72,
  AUD: 1.92,
  JPY: 191.5,
  CNY: 9.12,
  INR: 106.5,
};

type RateCache = {
  rates: Record<string, number>;
  fetchedAt: number;
};

let rateCache: RateCache | null = null;
const CACHE_TTL_MS = 3_600_000; // 1 hour

/**
 * Get current exchange rates relative to GBP.
 * For MVP, uses fallback rates. Future: fetch from API.
 */
export async function getRates(): Promise<Record<string, number>> {
  // Check cache first
  if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_TTL_MS) {
    return rateCache.rates;
  }

  // MVP: use fallback rates (no external API dependency)
  // In production, you could fetch from exchangerate-api.com or similar
  const rates = { ...FALLBACK_RATES };

  rateCache = { rates, fetchedAt: Date.now() };
  return rates;
}

/**
 * Convert an amount from one currency to another.
 *
 * @param amount - The amount to convert
 * @param from - Source currency code (ISO 4217)
 * @param to - Target currency code (ISO 4217)
 * @returns Converted amount, rounded to 2 decimal places
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount;

  const rates = await getRates();

  // Convert to GBP first (base), then to target
  const fromRate = rates[from.toUpperCase()];
  const toRate = rates[to.toUpperCase()];

  if (!fromRate || !toRate) {
    throw new Error(
      `Unsupported currency: ${!fromRate ? from : to}. Supported: ${Object.keys(rates).join(", ")}`
    );
  }

  const amountInGbp = amount / fromRate;
  const converted = amountInGbp * toRate;

  return Math.round(converted * 100) / 100;
}

/**
 * Get a human-readable list of supported currencies.
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(FALLBACK_RATES);
}
