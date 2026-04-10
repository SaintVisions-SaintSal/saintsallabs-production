# SaintSal Labs — Platform (saintsallabs-production)

> SaintVision Technologies LLC | CEO: Ryan "Cap" Capatosto | Patent #10,290,222 (HACP)  
> Stack: Next.js 14 App Router · TypeScript · Supabase · Stripe LIVE · Claude API · ElevenLabs · Vercel

---

## 1. Tech Stack & Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router (TypeScript strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) — single source of truth for auth + billing |
| Auth | Supabase Auth (magic link + Google OAuth) |
| AI | Claude claude-sonnet-4-6 — SAL Supreme v4.0 system prompt |
| Voice | ElevenLabs Agent ID: agent_5401k855rq5afqprn6vd3mh6sn7z |
| Payments | Stripe LIVE (webhook required for plan sync) |
| Deploy | Vercel — Saint Vision Technologies team |
| DNS | Cloudflare — saintsallabs.com |

### App Routes
```
/app/(auth)/login         — Supabase magic link login
/app/(auth)/signup        — Signup → profile create → Stripe customer
/app/(auth)/callback      — OAuth callback handler
/app/(dashboard)/dashboard — Main dashboard
/app/(dashboard)/builder   — No-code agent builder IDE
/app/(dashboard)/chat      — Claude streaming chat
/app/(dashboard)/intelligence — Multi-vertical AI
/app/(dashboard)/real-estate — Real estate vertical
/app/(dashboard)/cookin-cards — CookinCards feature
/app/(dashboard)/launch    — LaunchPad
/app/(dashboard)/deploy    — Deploy management
/app/(dashboard)/settings  — User settings
/app/billing               — Stripe billing portal
```

### API Routes
- `POST /api/chat` — Claude streaming (SAL Supreme v4.0)
- `POST /api/builder/agent` — Agent builder pipeline
- `GET/PUT/DELETE /api/builder/projects/[id]` — Project CRUD
- `POST /api/webhooks/stripe` — Stripe webhook → plan sync
- `POST /api/billing/portal` — Stripe portal session
- `POST /api/cards/scan|search` — CookinCards
- `POST /api/creative/generate` — Creative studio

---

## 2. Project Conventions & Style Guide

- **TypeScript strict mode** — zero `any` types. Use `unknown` + type guards.
- **shadcn/ui only** — never raw HTML form elements. All components from `src/components/ui/`.
- **Tailwind only** — no inline styles, no CSS modules except for animations.
- **API routes** — every route.ts must handle errors with try/catch and return typed JSON.
- **Server components by default** — only add `'use client'` when interactivity requires it.
- **Environment variables** — all env vars must be in `.env.example` before use.
- **No direct AI calls from client** — all AI traffic routes through `/api/chat` or `/api/builder/agent`.
- **Supabase RLS** — every new table requires Row Level Security policies before shipping.

---

## 3. Testing Requirements

- **Unit tests** — Vitest for utility functions and lib/ modules
- **Integration tests** — every API route gets a curl test before merge
- **E2E** — Playwright for auth flow, billing flow, chat flow
- **Stripe** — use Stripe CLI for webhook testing locally (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- **Pre-ship gate** — `tsc --noEmit` must pass with 0 errors

### Endpoint Test Pattern
```bash
# Chat
curl -s -w "\nHTTP: %{http_code}" -X POST https://saintsallabs.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'

# Health
curl -s -w "\nHTTP: %{http_code}" https://saintsallabs.com/api/health
```

---

## 4. Git Workflow

- **Branches:** `main` (production) → `staging` → `feature/*`
- **Commit format:** `Build #XX — [short description]`
- **Never force push main**
- **PR required** for any change touching: auth, billing, AI routes, Supabase schema
- **Vercel preview** — every PR gets an auto-deployed preview URL
- **Deploy sequence:**
  1. `supabase db push` (if schema changed)
  2. `git push origin main`
  3. Vercel auto-deploys
  4. Cloudflare cache purge post-deploy

---

## 5. Security & Compliance

- **Never commit secrets** — use `.env.local` (never `.env`)
- **`.env.local` is gitignored** — confirm before every commit
- **`.claude/settings.local.json` is gitignored** — never commit
- **PreCommit hook enabled** — blocks commits containing API keys
- **Stripe webhook secret** — stored in env only, never logged
- **Supabase service key** — server-side only, never exposed to client
- **ElevenLabs key** — server-side only
- **MCP scope** — minimum permissions, no wildcard access
- **HACP protocol** — all AI responses are filtered through responsible intelligence layer

---

## 6. Credits / Metering System

| Plan | Credits/Month | Model |
|------|-------------|-------|
| Free | 100 | claude-haiku |
| Pro | 1,000 | claude-sonnet |
| Enterprise | Unlimited | claude-opus |

Credits tracked in `usage_log` table. When `credits_remaining = 0` → Stripe upgrade prompt.

---

## Anti-Patterns — Never Do These

- Call Anthropic/OpenAI/ElevenLabs directly from client components
- Add `any` types to TypeScript
- Skip RLS policies on new Supabase tables
- Commit `.env.local` or `settings.local.json`
- Push directly to `main` without a PR for critical paths
- Use `console.log` in production — use structured logger
- Add new npm packages without checking bundle impact
