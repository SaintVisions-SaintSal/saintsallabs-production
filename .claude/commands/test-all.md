# /test-all — Full Test Suite (Platform)

Execute the complete test suite. Must pass before any deploy.

## Steps

```bash
# 1. TypeScript compile check
npx tsc --noEmit

# 2. Unit tests
npx vitest run

# 3. API endpoint tests
curl -s -w "\nHTTP: %{http_code}" https://saintsallabs.com/api/health
curl -s -w "\nHTTP: %{http_code}" -X POST https://saintsallabs.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
curl -s -w "\nHTTP: %{http_code}" -X POST https://saintsallabs.com/api/builder/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test agent"}'

# 4. Auth flow test (manual or Playwright)
# - Sign up with test email
# - Magic link received
# - Profile created in Supabase
# - Stripe customer created

# 5. Billing flow test
# - Stripe CLI webhook test
stripe trigger customer.subscription.updated
```

## Pass Criteria
- TypeScript: 0 errors
- All curl tests: HTTP 200
- Auth flow: profile + Stripe customer created in < 60s
- Stripe webhook: plan_tier updated in profiles table
