import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    priceId: null,
    credits: 100,
    features: ["SAL Mini (Haiku)", "5 projects", "Community support"],
  },
  starter: {
    name: "Starter",
    priceId: "price_starter",
    credits: 10_000,
    features: [
      "SAL Pro (Sonnet)",
      "25 projects",
      "Email support",
      "Custom domains",
    ],
  },
  pro: {
    name: "Pro",
    priceId: "price_pro",
    credits: 100_000,
    features: [
      "SAL Pro (Sonnet)",
      "Unlimited projects",
      "Priority support",
      "Custom domains",
      "API access",
    ],
  },
  teams: {
    name: "Teams",
    priceId: "price_teams",
    credits: 1_000_000,
    features: [
      "SAL Max (Opus)",
      "Unlimited projects",
      "Dedicated support",
      "Custom domains",
      "API access",
      "Team management",
      "SSO",
    ],
  },
} as const;
