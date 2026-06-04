// ============================================================================
// Kernel — Gemini OCR Client
// ============================================================================
// Sends receipt images to Gemini 2.5 Flash Lite and returns structured data.
// Model: gemini-2.5-flash-lite-001 (~$0.0002 per receipt)

import type { GeminiReceiptData } from "@/types";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-001:generateContent";

const EXTRACTION_PROMPT = `Extract all line items from this receipt. Return ONLY valid JSON (no markdown formatting, no backticks) with this exact structure:
{
  "merchant": "Store name or null",
  "date": "YYYY-MM-DD or null",
  "items": [
    {"name": "Item description", "quantity": 1, "unitPrice": 0.00, "totalPrice": 0.00}
  ],
  "tax": 0.00 or null,
  "grandTotal": 0.00 or null,
  "currency": "GBP or null"
}

Rules:
- For quantity, use null if not clear (default to 1)
- For unitPrice, use null if only total price is visible
- For totalPrice, use null if only unit price is visible
- For currency, use ISO 4217 code (GBP, USD, EUR, etc.) or null
- If completely uncertain about a field, use null
- Extract ALL line items — do not skip any`;

export interface GeminiError {
  code: string;
  message: string;
}

/**
 * Parse a receipt image and extract structured data using Gemini 2.5 Flash Lite.
 *
 * @param imageBase64 - Base64-encoded image data (without data URI prefix)
 * @param mimeType - MIME type of the image (e.g., "image/jpeg", "image/png")
 * @returns Parsed receipt data
 * @throws GeminiError on failure
 */
export async function parseReceiptImage(
  imageBase64: string,
  mimeType: string
): Promise<GeminiReceiptData> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw Object.assign(new Error("Gemini API key not configured"), {
      code: "MISSING_API_KEY",
    } satisfies GeminiError);
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
          {
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1, // Low temperature for consistent structured output
      topP: 0.95,
      topK: 16,
      maxOutputTokens: 2048,
    },
  };

  let response: Response;

  try {
    response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15_000), // 15-second timeout
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw Object.assign(
        new Error("Gemini request timed out. Try a clearer photo."),
        { code: "TIMEOUT" } satisfies GeminiError
      );
    }
    throw Object.assign(
      new Error(
        `Network error contacting Gemini API: ${(err as Error).message}`
      ),
      { code: "NETWORK_ERROR" } satisfies GeminiError
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw Object.assign(
      new Error(`Gemini API error (${response.status}): ${errorText}`),
      { code: "API_ERROR" } satisfies GeminiError
    );
  }

  let responseData: unknown;
  try {
    responseData = await response.json();
  } catch {
    throw Object.assign(
      new Error("Failed to parse Gemini API response"),
      { code: "PARSE_ERROR" } satisfies GeminiError
    );
  }

  const parsed = extractReceiptData(responseData);

  if (!parsed) {
    throw Object.assign(
      new Error(
        "Could not read this receipt. Try a clearer photo with better lighting."
      ),
      { code: "EMPTY_RESPONSE" } satisfies GeminiError
    );
  }

  return parsed;
}

/**
 * Extract structured receipt data from Gemini API response.
 * Handles various response shapes and malformed JSON.
 */
function extractReceiptData(
  responseData: unknown
): GeminiReceiptData | null {
  try {
    const candidates = (responseData as Record<string, unknown>)
      ?.candidates as Array<Record<string, unknown>> | undefined;

    if (!candidates || candidates.length === 0) {
      return null;
    }

    const content = candidates[0]?.content as
      | Record<string, unknown>
      | undefined;
    const parts = content?.parts as Array<Record<string, unknown>> | undefined;

    if (!parts || parts.length === 0) {
      return null;
    }

    const text = parts[0]?.text as string | undefined;

    if (!text || text.trim().length === 0) {
      return null;
    }

    // Try to parse the JSON from the response text
    // Handle cases where Gemini wraps JSON in markdown code blocks
    const cleaned = cleanJsonString(text);
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    return {
      merchant: parsed.merchant as string | null ?? null,
      date: parsed.date as string | null ?? null,
      items: Array.isArray(parsed.items)
        ? (parsed.items as Array<Record<string, unknown>>).map((item, i) => ({
            name: String(item.name ?? `Item ${i + 1}`),
            quantity: safeParseFloat(item.quantity, 1),
            unitPrice: safeParseFloat(item.unitPrice, null),
            totalPrice: safeParseFloat(item.totalPrice, null),
          }))
        : [],
      tax: safeParseFloat(parsed.tax, null),
      grandTotal: safeParseFloat(parsed.grandTotal, null),
      currency: (parsed.currency as string) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Clean a JSON string by removing markdown formatting and trimming.
 */
function cleanJsonString(text: string): string {
  let cleaned = text.trim();

  // Remove markdown code block fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }

  return cleaned.trim();
}

/**
 * Safely parse a numeric value, returning a default on failure.
 */
function safeParseFloat(
  value: unknown,
  defaultValue: number | null
): number | null {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
}
