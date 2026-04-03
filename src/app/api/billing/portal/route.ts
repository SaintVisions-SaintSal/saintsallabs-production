import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";

export const runtime = "nodejs";

/**
 * Creates a Stripe Customer Portal session for managing subscriptions
 * POST /api/billing/portal
 * Body: { customerId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing customer ID" },
        { status: 400 }
      );
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://saintsallabs.com"}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[Billing Portal] Error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
