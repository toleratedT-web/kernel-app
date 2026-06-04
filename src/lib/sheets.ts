// ============================================================================
// Kernel — Google Sheets API Client
// ============================================================================
// Handles OAuth flow and appending receipt data to the user's Google Sheet.

import { google } from "@googleapis/sheets";
import type { sheets_v4 } from "@googleapis/sheets";
import type { SheetsToken } from "@/types";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_TITLE = "Kernel";
const HEADER_ROW = [
  "Date",
  "Merchant",
  "Item",
  "Quantity",
  "Unit Price",
  "Total",
  "Category",
  "Currency",
];

/**
 * Build the Google OAuth2 client for the Sheets API.
 */
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Google OAuth environment variables: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client;
}

/**
 * Generate the Google OAuth consent URL for Sheets access.
 */
export function getSheetsAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

/**
 * Exchange an authorization code for tokens.
 */
export async function getTokensFromCode(
  code: string
): Promise<SheetsToken> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens as unknown as SheetsToken;
}

/**
 * Refresh an expired access token using the refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<SheetsToken> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials as unknown as SheetsToken;
}

/**
 * Get an authenticated Sheets API client.
 */
async function getSheetsClient(
  token: SheetsToken
): Promise<sheets_v4.Sheets> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(token as unknown as { refresh_token?: string });

  // Auto-refresh token if expired
  if (
    token.expiry_date &&
    Date.now() >= token.expiry_date - 60_000 && // 1-minute buffer
    token.refresh_token
  ) {
    const refreshed = await refreshAccessToken(token.refresh_token);
    oauth2Client.setCredentials(
      refreshed as unknown as { refresh_token?: string }
    );
  }

  return google.sheets({ version: "v4", auth: oauth2Client });
}

/**
 * Ensure the "Kernel" sheet tab exists. If not, create it with headers.
 *
 * @param sheets - Authenticated Sheets API client
 * @param spreadsheetId - ID of the spreadsheet
 * @returns The range to append to (e.g., "Kernel!A:H")
 */
async function ensureSheetTab(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string
): Promise<string> {
  try {
    // Get existing sheets
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const existingSheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === SHEET_TITLE
    );

    if (existingSheet) {
      return `${SHEET_TITLE}!A:H`;
    }

    // Create the sheet tab
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: SHEET_TITLE,
              },
            },
          },
        ],
      },
    });

    // Write header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_TITLE}!A1:H1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [HEADER_ROW],
      },
    });

    return `${SHEET_TITLE}!A:H`;
  } catch (err) {
    throw new Error(
      `Failed to access spreadsheet: ${(err as Error).message}`
    );
  }
}

/**
 * Append receipt items to the user's Google Sheet.
 *
 * @param token - Authenticated Sheets OAuth token
 * @param spreadsheetId - Target spreadsheet ID
 * @param merchant - Receipt merchant name
 * @param date - Receipt date
 * @param items - Array of items to append
 * @param currency - Currency code
 * @returns URL to the sheet
 */
export async function appendReceiptToSheet(
  token: SheetsToken,
  spreadsheetId: string,
  merchant: string,
  date: string,
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number | null;
    totalPrice: number | null;
    category: string | null;
  }>,
  currency: string
): Promise<{ sheetUrl: string }> {
  const sheets = await getSheetsClient(token);
  const range = await ensureSheetTab(sheets, spreadsheetId);

  // Build rows from items
  const rows = items.map((item) => [
    date,
    merchant,
    item.name,
    String(item.quantity),
    item.unitPrice !== null ? String(item.unitPrice) : "",
    item.totalPrice !== null ? String(item.totalPrice) : "",
    item.category ?? "",
    currency,
  ]);

  if (rows.length === 0) {
    throw new Error("No items to export.");
  }

  // Append rows in batches of 10 (stay under rate limits)
  const BATCH_SIZE = 10;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: batch,
      },
    });
  }

  return {
    sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}
