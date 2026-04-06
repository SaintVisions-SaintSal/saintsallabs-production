import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/health
 *
 * Public health check endpoint for monitoring, uptime checks, and GHL agent verification.
 * Returns platform status and key service availability.
 */
export async function GET() {
  const checks = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    supabase: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    stripe: !!process.env.STRIPE_SECRET_KEY,
    ghl: !!(
      process.env.GHL_PRIVATE_TOKEN || process.env.GHL_API_KEY
    ),
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
  };

  const allHealthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      platform: "SaintSalLabs",
      version: "2.0.0",
      services: checks,
      endpoints: {
        chat: "/api/chat",
        mcp: "/api/mcp/chat",
        entityAdvisor: "/api/launchpad/entity-advisor",
        creative: "/api/creative/generate",
        builder: "/api/builder/agent",
        ghlContacts: "/api/ghl/contacts",
        generate: "/api/generate",
        stripeWebhook: "/api/webhooks/stripe",
        billingPortal: "/api/billing/portal",
      },
    },
    { status: allHealthy ? 200 : 503 }
  );
}
