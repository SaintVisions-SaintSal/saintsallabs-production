import { NextResponse, type NextRequest } from "next/server";
import { getStripe, PRICE_TO_TIER, TIER_CREDITS } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";
import {
  createGHLContact,
  addGHLTags,
  provisionGHLSubAccount,
  handlePaymentFailed,
} from "@/lib/ghl/provisioning";
import type Stripe from "stripe";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Service-role client (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] Processing event: ${event.type}`);

    switch (event.type) {
      // ─────────────────────────────────────────────
      // CHECKOUT COMPLETED — New subscription created
      // ─────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        console.log(
          `[Stripe Webhook] Checkout completed: customer=${customerId}, sub=${subscriptionId}`
        );

        if (subscriptionId) {
          // Get subscription to find the actual price/tier
          const subscription =
            await getStripe().subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const tier = PRICE_TO_TIER[priceId] || "free";
          const credits = TIER_CREDITS[tier] || 50;

          // Find profile by Stripe customer ID
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, ghl_contact_id, tier")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            const previousTier = profile.tier || "free";

            // Update profile with new tier
            await supabase
              .from("profiles")
              .update({
                stripe_subscription_id: subscriptionId,
                tier: tier,
                tier: tier,
                role: tier,
                credits_remaining: credits,
                credits_monthly_limit: credits,
                updated_at: new Date().toISOString(),
              })
              .eq("id", profile.id);

            console.log(
              `[Stripe Webhook] Profile ${profile.id} updated: ${previousTier} → ${tier}`
            );

            // Ensure GHL contact exists
            if (!profile.ghl_contact_id) {
              const { data: fullProfile } = await supabase
                .from("profiles")
                .select("email, full_name")
                .eq("id", profile.id)
                .single();

              if (fullProfile) {
                const contactId = await createGHLContact({
                  id: profile.id,
                  email: fullProfile.email,
                  full_name: fullProfile.full_name,
                });

                if (contactId) {
                  await supabase
                    .from("profiles")
                    .update({ ghl_contact_id: contactId })
                    .eq("id", profile.id);
                }
              }
            }

            // Trigger GHL provisioning for paid tiers
            if (tier !== "free" && previousTier === "free") {
              await provisionGHLSubAccount(profile.id, tier);
            } else if (tier !== "free") {
              // Just update tags for tier change
              const { data: updatedProfile } = await supabase
                .from("profiles")
                .select("ghl_contact_id")
                .eq("id", profile.id)
                .single();

              if (updatedProfile?.ghl_contact_id) {
                await addGHLTags(updatedProfile.ghl_contact_id, [
                  `tier-${tier}`,
                  "upgraded",
                  "active-subscriber",
                ]);
              }
            }
          } else {
            // Profile not found by customer ID — try metadata
            const userId = session.metadata?.userId;
            if (userId) {
              await supabase
                .from("profiles")
                .update({
                  stripe_customer_id: customerId,
                  stripe_subscription_id: subscriptionId,
                  tier: tier,
                  tier: tier,
                  role: tier,
                  credits_remaining: credits,
                  credits_monthly_limit: credits,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", userId);

              console.log(
                `[Stripe Webhook] Profile ${userId} updated via metadata fallback`
              );
            } else {
              console.warn(
                `[Stripe Webhook] No profile found for customer ${customerId}`
              );
            }
          }
        }
        break;
      }

      // ─────────────────────────────────────────────
      // SUBSCRIPTION UPDATED — Plan change mid-cycle
      // ─────────────────────────────────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] || "free";
        const credits = TIER_CREDITS[tier] || 50;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, tier, ghl_contact_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          const previousTier = profile.tier || "free";

          await supabase
            .from("profiles")
            .update({
              tier: tier,
              tier: tier,
              role: tier,
              credits_remaining: credits,
              credits_monthly_limit: credits,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          console.log(
            `[Stripe Webhook] Subscription updated: ${profile.id} → ${tier}`
          );

          // Update GHL tags
          if (profile.ghl_contact_id) {
            const isUpgrade =
              ["free", "starter", "pro", "teams", "enterprise"].indexOf(tier) >
              ["free", "starter", "pro", "teams", "enterprise"].indexOf(
                previousTier
              );

            await addGHLTags(profile.ghl_contact_id, [
              `tier-${tier}`,
              isUpgrade ? "upgraded" : "downgraded",
            ]);
          }

          // Provision if first-time paid
          if (previousTier === "free" && tier !== "free") {
            await provisionGHLSubAccount(profile.id, tier);
          }
        }
        break;
      }

      // ─────────────────────────────────────────────
      // SUBSCRIPTION DELETED — Cancelled
      // ─────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, ghl_contact_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              tier: "free",
              tier: "free",
              role: "free",
              credits_remaining: 50,
              credits_monthly_limit: 50,
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          console.log(
            `[Stripe Webhook] Subscription cancelled: ${profile.id} → free`
          );

          // Tag as churned in GHL
          if (profile.ghl_contact_id) {
            await addGHLTags(profile.ghl_contact_id, [
              "tier-free",
              "churned",
              "subscription-cancelled",
            ]);
          }
        }
        break;
      }

      // ─────────────────────────────────────────────
      // PAYMENT FAILED — Flag as at-risk
      // ─────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          // Flag in Supabase
          await supabase
            .from("profiles")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", profile.id);

          // Trigger at-risk workflow in GHL
          await handlePaymentFailed(profile.id);

          console.log(
            `[Stripe Webhook] Payment failed for ${profile.id} — at-risk triggered`
          );
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
