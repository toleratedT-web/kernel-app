// ============================================================================
// Kernel — GET /api/sheets/callback
// ============================================================================
// Handles the Google OAuth callback for Sheets API.
// Exchanges the authorization code for tokens and stores them in the profile.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  authenticateRequest,
  errorResponse,
} from "@/lib/auth-helpers";
import { getTokensFromCode } from "@/lib/sheets";

export async function GET(request: NextRequest) {
  try {
    const { userId, supabase } = await authenticateRequest();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL(
          "/settings?error=google_oauth_denied",
          request.url
        )
      );
    }

    if (!code) {
      return errorResponse("Missing authorization code.", 400);
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Get user info from Google
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    let googleEmail: string | null = null;
    if (userInfoRes.ok) {
      const userInfo = await userInfoRes.json();
      googleEmail = userInfo.email ?? null;
    }

    // Get/create a default spreadsheet
    const sheetsRes = await fetch(
      "https://sheets.googleapis.com/v4/spreadsheets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            title: "Kernel Receipts",
          },
        }),
      }
    );

    let sheetId: string | null = null;
    if (sheetsRes.ok) {
      const sheetData = await sheetsRes.json();
      sheetId = sheetData.spreadsheetId ?? null;
    }

    // Store tokens and email in profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        sheets_token: tokens as unknown as Record<string, unknown>,
        sheets_email: googleEmail,
        sheets_sheet_id: sheetId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to save sheets token:", updateError);
    }

    // Redirect back to settings
    return NextResponse.redirect(new URL("/settings?sheets=connected", request.url));
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Sheets callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=sheets_connection_failed", request.url)
    );
  }
}
