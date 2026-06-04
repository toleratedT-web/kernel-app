// ============================================================================
// Kernel — POST /api/stripe/customer-portal
// ============================================================================
// Create a Stripe Customer Portal session for managing subscriptions.
// Redirects the user to the Stripe-hosted billing portal.

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth-helpers";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
  try {
    const { profile } = await authenticateRequest();

    const stripe = getStripeClient();

    const customerId = profile.stripeCustomerId;

    if (!customerId) {
      return errorResponse(
        "No Stripe customer found. Subscribe to a plan first.",
        400
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      }/billing`,
    });

    if (!session.url) {
      return errorResponse("Failed to create customer portal session.", 500);
    }

    return successResponse({ url: session.url });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Customer portal error:", error);
    return errorResponse(
      `Failed to open customer portal: ${(error as Error).message}`,
      500
    );
  }
}
