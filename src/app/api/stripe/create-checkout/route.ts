// ============================================================================
// Kernel — POST /api/stripe/create-checkout
// ============================================================================
// Create a Stripe Checkout session for subscription purchase.
// Request body: { priceId: string; mode: "subscription" }
// Response: { url: string } — redirect user to this Stripe Checkout URL

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth-helpers";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { userId, profile, supabase } = await authenticateRequest();

    const body = await request.json();
    const { priceId } = body as { priceId?: string };

    if (!priceId) {
      return errorResponse("Missing priceId. Provide a Stripe price ID.", 400);
    }

    const stripe = getStripeClient();

    // Get or create Stripe customer
    let customerId = profile.stripeCustomerId;

    if (!customerId) {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: profile.email ?? undefined,
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/pricing?canceled=true`,
      metadata: {
        user_id: userId,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
        },
      },
    });

    if (!session.url) {
      return errorResponse("Failed to create checkout session.", 500);
    }

    return successResponse({ url: session.url });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Create checkout error:", error);
    return errorResponse(
      `Failed to create checkout: ${(error as Error).message}`,
      500
    );
  }
}
