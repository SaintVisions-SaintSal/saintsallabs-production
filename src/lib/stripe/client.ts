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
    priceId: {
      monthly: "price_1T7p1tL47U80vDLAe9aWVKA0",
      annual: "price_1T7p1tL47U80vDLAnxtkrGV4",
    },
    credits: 50,
    requests: 50,
    price: { monthly: 0, annual: 0 },
    features: ["SAL Mini (Haiku)", "5 projects", "Community support"],
  },
  starter: {
    name: "Starter",
    priceId: {
      monthly: "price_1T7p1sL47U80vDLAgU2shcQO",
      annual: "price_1T7p1sL47U80vDLAYEEv8Kmg",
    },
    credits: 500,
    requests: 500,
    price: { monthly: 27, annual: 270 },
    features: [
      "SAL Pro (Sonnet)",
      "25 projects",
      "Email support",
      "Custom domains",
      "Voice AI (ElevenLabs)",
    ],
  },
  pro: {
    name: "Pro",
    priceId: {
      monthly: "price_1T7p1tL47U80vDLAVC0N4N4J",
      annual: "price_1T7p1tL47U80vDLAk5HK8YcR",
    },
    credits: 2_000,
    requests: 2_000,
    price: { monthly: 97, annual: 970 },
    features: [
      "SAL Max (Opus)",
      "Unlimited projects",
      "Priority support",
      "Custom domains",
      "API access",
      "War Room",
    ],
  },
  teams: {
    name: "Teams",
    priceId: {
      monthly: "price_1T7p1uL47U80vDLA9QF62BKS",
      annual: "price_1T7p1uL47U80vDLAjlnLTuul",
    },
    credits: 10_000,
    requests: 10_000,
    price: { monthly: 297, annual: 2_970 },
    features: [
      "SAL Max Pro (Opus)",
      "Unlimited projects",
      "Dedicated support",
      "Custom domains",
      "API access",
      "Team management (10 seats)",
      "SSO",
    ],
  },
  enterprise: {
    name: "Enterprise",
    priceId: {
      monthly: "price_1T7p1uL47U80vDLAR4Wk6uW0",
      annual: "price_1T7p1uL47U80vDLAk9UA0lnr",
    },
    credits: 999_999,
    requests: 999_999,
    price: { monthly: 497, annual: 4_970 },
    features: [
      "SAL Max Pro (Opus)",
      "Unlimited everything",
      "White-glove support",
      "White-label capability",
      "API access",
      "Team management (100 seats)",
      "SSO",
      "Custom integrations",
    ],
  },
} as const;

// Stripe Price ID → Tier mapping (for webhook lookups)
export const PRICE_TO_TIER: Record<string, string> = {
  // Monthly
  "price_1T7p1tL47U80vDLAe9aWVKA0": "free",
  "price_1T7p1sL47U80vDLAgU2shcQO": "starter",
  "price_1T7p1tL47U80vDLAVC0N4N4J": "pro",
  "price_1T7p1uL47U80vDLA9QF62BKS": "teams",
  "price_1T7p1uL47U80vDLAR4Wk6uW0": "enterprise",
  // Annual
  "price_1T7p1tL47U80vDLAnxtkrGV4": "free",
  "price_1T7p1sL47U80vDLAYEEv8Kmg": "starter",
  "price_1T7p1tL47U80vDLAk5HK8YcR": "pro",
  "price_1T7p1uL47U80vDLAjlnLTuul": "teams",
  "price_1T7p1uL47U80vDLAk9UA0lnr": "enterprise",
};

// Tier → Credits mapping (for webhook lookups)
export const TIER_CREDITS: Record<string, number> = {
  free: 50,
  starter: 500,
  pro: 2_000,
  teams: 10_000,
  enterprise: 999_999,
};

// Stripe Payment Links (pre-built checkout)
export const PAYMENT_LINKS = {
  free: "https://buy.stripe.com/28EaEYgvk7zjbaPa2gbjW06",
  starter: "https://buy.stripe.com/8x2eVea6W3j30wb3DSbjW07",
  pro: "https://buy.stripe.com/5kQ3cw92S8Dn3In4HWbjW08",
  teams: "https://buy.stripe.com/fZufZi5QG9Hr2Ej4HWbjW09",
  enterprise: "https://buy.stripe.com/7sY5kEbb0cTDa6L2zObjW0a",
} as const;

// Stripe Pricing Table ID (embeddable)
export const PRICING_TABLE_ID = "prctbl_1SIQItGVzsQbCDmmZ97ubwpM";
