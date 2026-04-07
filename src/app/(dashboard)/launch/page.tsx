"use client";

import { useState } from "react";

const STEPS = [
  {
    id: "git-push",
    title: "Push audit commit to GitHub",
    priority: "CRITICAL",
    time: "5 min",
    owner: "Cap",
    details: "Commit d193935 (13 files, 395 lines) must hit main on SaintVisions-SaintSal/saintsallabs-web. Run: git push origin main from your Claude Code working directory. Vercel auto-deploys on push.",
    link: "https://github.com/SaintVisions-SaintSal/saintsallabs-web",
    verification: "Check Vercel dashboard for new deployment with commit d193935",
  },
  {
    id: "supabase-migration",
    title: "Run Supabase migration SQL",
    priority: "CRITICAL",
    time: "2 min",
    owner: "Cap",
    details: "Open Supabase SQL Editor, paste the migration SQL (provided below). Adds 4 columns, 8 indexes, 7 RLS policies. Run verification queries at the bottom to confirm.",
    link: "https://supabase.com/dashboard/project/euxrlpuegeiggedqbkiv/sql",
    verification: "Verification queries return 4 columns, 8 indexes, 7 policies",
  },
  {
    id: "vercel-env",
    title: "Set Vercel environment variables",
    priority: "CRITICAL",
    time: "5 min",
    owner: "Cap",
    details: "Vercel → saintsallabs-web → Settings → Env Vars. Required: SUPABASE_SERVICE_ROLE_KEY, STRIPE_WEBHOOK_SECRET (after Step 4), GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, GHL_COMPANY_ID, GHL_WEBHOOK_TOKEN, SAL_GATEWAY_KEY, NEXT_PUBLIC_APP_URL",
    link: "https://vercel.com/saint-vision-technologies-47e244e3/saintsallabs-web/settings/environment-variables",
    verification: "All 8 env vars set for Production environment",
  },
  {
    id: "stripe-webhook",
    title: "Register Stripe webhook endpoint",
    priority: "HIGH",
    time: "3 min",
    owner: "Cap",
    details: "Stripe Dashboard → Developers → Webhooks → Add Endpoint. URL: https://saintsallabs.com/api/webhooks/stripe. Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed. Copy whsec_ secret → add to Vercel.",
    link: "https://dashboard.stripe.com/webhooks",
    verification: "Webhook shows in Stripe dashboard, whsec_ added to Vercel",
  },
  {
    id: "ghl-agents",
    title: "Wire GHL Agent Studio webhooks",
    priority: "HIGH",
    time: "10 min",
    owner: "Cap",
    details: "For each of 6 agent nodes in GHL Agent Studio: Add Webhook tool with the correct URL and header x-sal-key: saintvision_webhook_2025",
    link: "https://app.gohighlevel.com",
    verification: "Test each agent → check Vercel runtime logs for 200 responses",
  },
  {
    id: "ghl-snapshots",
    title: "Create GHL tier snapshots",
    priority: "MEDIUM",
    time: "15 min",
    owner: "Cap",
    details: "Create 4 snapshots in GHL: Starter, Pro, Teams, Enterprise. Add snapshot IDs to Vercel env vars for auto-provisioning on subscription creation.",
    link: "https://app.gohighlevel.com",
    verification: "4 snapshots created, IDs saved to Vercel env vars",
  },
  {
    id: "health-check",
    title: "Verify production health endpoint",
    priority: "CRITICAL",
    time: "1 min",
    owner: "Cap",
    details: "After Vercel redeploys with all fixes: curl https://saintsallabs.com/api/health. Expected: status=healthy with Stripe, GHL, Supabase, ElevenLabs all showing connected.",
    link: "https://saintsallabs.com/api/health",
    verification: "JSON response shows status: healthy, all integrations connected",
  },
];

const ENV_VARS = [
  { key: "SUPABASE_SERVICE_ROLE_KEY", value: "eyJ... (from Supabase → Settings → API)", source: "Supabase" },
  { key: "STRIPE_WEBHOOK_SECRET", value: "whsec_... (from Step 4)", source: "Stripe" },
  { key: "GHL_PRIVATE_TOKEN", value: "pit-24654b55-6e44-49f5-8912-5632ab08c615", source: "GHL" },
  { key: "GHL_LOCATION_ID", value: "oRA8vL3OSiCPjpwmEC0V", source: "GHL" },
  { key: "GHL_COMPANY_ID", value: "FrptZuAoaUjDyOFOeaNZ", source: "GHL" },
  { key: "GHL_WEBHOOK_TOKEN", value: "saintvision_webhook_2025", source: "Config" },
  { key: "SAL_GATEWAY_KEY", value: "saintvision_gateway_2025", source: "Config" },
  { key: "NEXT_PUBLIC_APP_URL", value: "https://saintsallabs.com", source: "Config" },
];

const GHL_AGENTS = [
  { node: "SAL Chat", endpoint: "/api/mcp/chat", method: "POST" },
  { node: "Launch Pad", endpoint: "/api/launchpad/entity-advisor", method: "POST" },
  { node: "Creative Studio", endpoint: "/api/creative/generate", method: "POST" },
  { node: "Builder Agent", endpoint: "/api/builder/agent", method: "POST" },
  { node: "CRM Contacts", endpoint: "/api/ghl/contacts", method: "POST" },
  { node: "Health Check", endpoint: "/api/health", method: "GET" },
];

const STRIPE_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
];

function PriorityBadge({ priority }) {
  const colors = {
    CRITICAL: { bg: "rgba(226, 75, 74, 0.12)", text: "#A32D2D", border: "#E24B4A" },
    HIGH: { bg: "rgba(239, 159, 39, 0.12)", text: "#854F0B", border: "#EF9F27" },
    MEDIUM: { bg: "rgba(29, 158, 117, 0.12)", text: "#0F6E56", border: "#1D9E75" },
  };
  const c = colors[priority] || colors.MEDIUM;
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>
      {priority}
    </span>
  );
}

export default function LaunchTracker() {
  const [completed, setCompleted] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState("checklist");

  const toggle = (id) => setCompleted((p) => ({ ...p, [id]: !p[id] }));
  const doneCount = Object.values(completed).filter(Boolean).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div style={{ fontFamily: "var(--font-sans, system-ui)", color: "var(--color-text-primary, #1a1a1a)", maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>SaintSal Labs — launch tracker</h2>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary, #666)" }}>{doneCount}/{STEPS.length} complete</span>
      </div>

      <div style={{ height: 6, background: "var(--color-background-secondary, #f0f0f0)", borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#1D9E75" : "#378ADD", borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid var(--color-border-tertiary, #e0e0e0)" }}>
        {["checklist", "env-vars", "ghl-wiring", "stripe-webhook"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "8px 16px", fontSize: 13, fontWeight: activeTab === tab ? 500 : 400, background: "none", border: "none",
            borderBottom: activeTab === tab ? "2px solid var(--color-text-primary, #1a1a1a)" : "2px solid transparent",
            color: activeTab === tab ? "var(--color-text-primary, #1a1a1a)" : "var(--color-text-secondary, #666)", cursor: "pointer",
          }}>
            {tab === "checklist" ? "Checklist" : tab === "env-vars" ? "Env vars" : tab === "ghl-wiring" ? "GHL wiring" : "Stripe webhook"}
          </button>
        ))}
      </div>

      {activeTab === "checklist" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STEPS.map((step, i) => (
            <div key={step.id} style={{
              background: completed[step.id] ? "var(--color-background-success, rgba(29,158,117,0.06))" : "var(--color-background-primary, #fff)",
              border: `0.5px solid ${completed[step.id] ? "var(--color-border-success, #1D9E75)" : "var(--color-border-tertiary, #e0e0e0)"}`,
              borderRadius: 8, padding: "12px 16px", transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="checkbox" checked={!!completed[step.id]} onChange={() => toggle(step.id)} style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#1D9E75" }} />
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary, #666)", minWidth: 16 }}>{i + 1}.</span>
                  <span style={{ fontSize: 14, fontWeight: 500, textDecoration: completed[step.id] ? "line-through" : "none", opacity: completed[step.id] ? 0.6 : 1 }}>{step.title}</span>
                  <PriorityBadge priority={step.priority} />
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary, #666)" }}>{step.time}</span>
                </div>
                <button onClick={() => setExpanded(expanded === step.id ? null : step.id)} style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-secondary, #666)", padding: "0 4px", transform: expanded === step.id ? "rotate(180deg)" : "none", transition: "transform 0.2s",
                }}>▾</button>
              </div>
              {expanded === step.id && (
                <div style={{ marginTop: 12, paddingLeft: 30, fontSize: 13, color: "var(--color-text-secondary, #666)", lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 8px" }}>{step.details}</p>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <a href={step.link} target="_blank" rel="noopener" style={{ color: "var(--color-text-info, #378ADD)", fontSize: 12 }}>Open →</a>
                    <span style={{ fontSize: 12 }}>✓ {step.verification}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "env-vars" && (
        <div style={{ fontSize: 13 }}>
          <p style={{ color: "var(--color-text-secondary, #666)", margin: "0 0 12px", lineHeight: 1.6 }}>
            Set these in Vercel → saintsallabs-web → Settings → Environment Variables (Production scope)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ENV_VARS.map((v) => (
              <div key={v.key} style={{ background: "var(--color-background-secondary, #f5f5f5)", borderRadius: 6, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, fontWeight: 500, color: "var(--color-text-primary, #1a1a1a)", minWidth: 220 }}>{v.key}</code>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary, #666)", flex: 1 }}>{v.value}</span>
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "var(--color-background-info, rgba(55,138,221,0.1))", color: "var(--color-text-info, #378ADD)" }}>{v.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "ghl-wiring" && (
        <div style={{ fontSize: 13 }}>
          <p style={{ color: "var(--color-text-secondary, #666)", margin: "0 0 4px", lineHeight: 1.6 }}>
            For each agent node in GHL Agent Studio, add a Webhook tool:
          </p>
          <p style={{ color: "var(--color-text-secondary, #666)", margin: "0 0 12px", fontSize: 12 }}>
            Base URL: <code style={{ fontFamily: "var(--font-mono, monospace)" }}>https://saintsallabs.com</code> &nbsp;|&nbsp; Header: <code style={{ fontFamily: "var(--font-mono, monospace)" }}>x-sal-key: saintvision_webhook_2025</code>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {GHL_AGENTS.map((a) => (
              <div key={a.node} style={{ background: "var(--color-background-secondary, #f5f5f5)", borderRadius: 6, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 500, minWidth: 140 }}>{a.node}</span>
                <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, flex: 1, color: "var(--color-text-info, #378ADD)" }}>
                  {a.method} https://saintsallabs.com{a.endpoint}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "stripe-webhook" && (
        <div style={{ fontSize: 13 }}>
          <p style={{ color: "var(--color-text-secondary, #666)", margin: "0 0 12px", lineHeight: 1.6 }}>
            Stripe Dashboard → Developers → Webhooks → Add Endpoint
          </p>
          <div style={{ background: "var(--color-background-secondary, #f5f5f5)", borderRadius: 8, padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary, #666)" }}>Endpoint URL</span>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, marginTop: 4, padding: "8px 12px", background: "var(--color-background-primary, #fff)", borderRadius: 4, border: "0.5px solid var(--color-border-tertiary, #e0e0e0)" }}>
                https://saintsallabs.com/api/webhooks/stripe
              </div>
            </div>
            <div>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary, #666)" }}>Events to listen for</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {STRIPE_EVENTS.map((e) => (
                  <code key={e} style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, padding: "4px 10px", background: "var(--color-background-primary, #fff)", borderRadius: 4, border: "0.5px solid var(--color-border-tertiary, #e0e0e0)" }}>{e}</code>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: 6, background: "rgba(239, 159, 39, 0.08)", border: "1px solid rgba(239, 159, 39, 0.2)" }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#854F0B" }}>After creating:</span>
              <span style={{ fontSize: 12, color: "#854F0B" }}> Copy the <code>whsec_...</code> signing secret → add as <code>STRIPE_WEBHOOK_SECRET</code> in Vercel env vars → redeploy</span>
            </div>
          </div>
        </div>
      )}

      {pct === 100 && (
        <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 8, background: "rgba(29, 158, 117, 0.08)", border: "1px solid rgba(29, 158, 117, 0.2)", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: "#0F6E56", marginBottom: 4 }}>SaintSal Labs is LIVE</div>
          <div style={{ fontSize: 13, color: "#0F6E56" }}>All systems go. Ship it, brother. LFG.</div>
        </div>
      )}
    </div>
  );
}
