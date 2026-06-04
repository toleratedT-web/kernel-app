// ============================================================================
// Kernel — GET /api/sheets/connect
// ============================================================================
// Redirects the authenticated user to Google OAuth consent screen
// for Google Sheets API access scopes.

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  errorResponse,
} from "@/lib/auth-helpers";
import { getSheetsAuthUrl } from "@/lib/sheets";

export async function GET() {
  try {
    // Authenticate before redirecting to OAuth
    await authenticateRequest();

    const authUrl = getSheetsAuthUrl();

    return NextResponse.redirect(authUrl);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Sheets connect error:", error);
    return errorResponse("Failed to initiate Google Sheets connection.", 500);
  }
}
