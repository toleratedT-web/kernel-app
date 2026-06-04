// ============================================================================
// Kernel — POST /api/stripe/webhook
// ============================================================================
// Stripe webhook handler for subscription lifecycle events.
// Handles: checkout.session.completed, invoice.paid,
//          customer.subscription.updated, customer.subscription.deleted
//
// IMPORTANT: This route must use raw request body for signature verification.
// The middleware skips this path.

import { NextResponse } from "next/server";
import { getStripeClient, mapPriceIdToTier } from "@/lib/stripe";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tier } from "@/types";

/**
 * Verify the Stripe webhook signature and parse the event.
 */
async function constructEvent(request: Request): Promise<{
  type: string;
  data: Record<string, unknown>;
} | null> {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
    return null;
  }

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("Missing stripe-signature header.");
      return null;
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    return {
      type: event.type,
      data: event.data.object as Record<string, unknown>,
    };
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const event = await constructEvent(request);

    if (!event) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data, supabase);
        break;
      }
      case "invoice.paid": {
        await handleInvoicePaid(event.data, supabase);
        break;
      }
      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event.data, supabase);
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data, supabase);
        break;
      }
      default: {
        console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }
}

// ─── Event Handlers ────────────────────────────────────────────────────────

/**
 * Handle checkout.session.completed — set tier and subscription IDs.
 */
async function handleCheckoutCompleted(
  data: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const userId = data.metadata?.user_id as string | undefined;
  const customerId = data.customer as string;
  const subscriptionId = data.subscription as string;

  // Get the line items to determine the price
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(data.id as string, {
    expand: ["line_items"],
  });

  const priceId = session.line_items?.data[0]?.price?.id;
  if (!priceId || !userId) return;

  const tier = mapPriceIdToTier(priceId);

  if (!tier) {
    console.warn(`Unknown price ID: ${priceId}. Tier not mapped.`);
    return;
  }

  // Update profile
  await supabase
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      tier,
      trial_ends_at: null, // Clear trial on paid subscription
    })
    .eq("id", userId);

  // Record subscription
  await supabase.from("subscriptions").insert({
    profile_id: userId,
    stripe_subscription_id: subscriptionId as string,
    stripe_price_id: priceId,
    status: "active",
    tier,
    current_period_start: new Date(
      (data.current_period_start as number) * 1000
    ).toISOString(),
    current_period_end: new Date(
      (data.current_period_end as number) * 1000
    ).toISOString(),
  });
}

/**
 * Handle invoice.paid — refresh subscription status.
 */
async function handleInvoicePaid(
  data: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const subscriptionId = data.subscription as string;

  if (!subscriptionId) return;

  await supabase
    .from("subscriptions")
    .update({ status: "active" })
    .eq("stripe_subscription_id", subscriptionId);
}

/**
 * Handle customer.subscription.updated — handle upgrades/downgrades.
 */
async function handleSubscriptionUpdated(
  data: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const subscriptionId = data.id as string;
  const status = data.status as string;
  const metadata = data.metadata as Record<string, string> | undefined;
  const userId = metadata?.user_id;

  // Get the price ID from the subscription items
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;

  if (!priceId) return;

  const tier = mapPriceIdToTier(priceId);

  if (!tier) return;

  // Update profile
  const updateData: Record<string, unknown> = {
    stripe_subscription_id: subscriptionId,
    tier,
  };

  if (userId) {
    await supabase.from("profiles").update(updateData).eq("id", userId);
  } else {
    // Find by subscription ID
    await supabase
      .from("profiles")
      .update(updateData)
      .eq("stripe_subscription_id", subscriptionId);
  }

  // Update subscription record
  await supabase
    .from("subscriptions")
    .update({
      status: status as string,
      stripe_price_id: priceId,
      tier,
    })
    .eq("stripe_subscription_id", subscriptionId);
}

/**
 * Handle customer.subscription.deleted — revert to free tier.
 */
async function handleSubscriptionDeleted(
  data: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const subscriptionId = data.id as string;

  await supabase
    .from("profiles")
    .update({
      tier: "free",
      stripe_subscription_id: null,
    })
    .eq("stripe_subscription_id", subscriptionId);

  await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscriptionId);
}
