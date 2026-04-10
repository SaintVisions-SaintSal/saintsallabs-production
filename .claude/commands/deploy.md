# /deploy — Deploy to Vercel (Platform)

Build and push to Vercel staging. Never deploy directly to production without a staging pass.

## Pre-Deploy Checklist

1. `npx tsc --noEmit` — must show 0 errors
2. `git status` — confirm no untracked secrets or `.env.local` staged
3. Run PreCommit secret scan
4. If schema changed: `supabase db push`

## Deploy Steps

```bash
# 1. Type check
npx tsc --noEmit

# 2. Schema push (if needed)
supabase db push

# 3. Push to main → Vercel auto-deploys
git push origin main

# 4. Monitor Vercel build
vercel logs --follow

# 5. Post-deploy tests
curl -s -w "\nHTTP: %{http_code}" https://saintsallabs.com/api/health
curl -s -w "\nHTTP: %{http_code}" -X POST https://saintsallabs.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"ping"}]}'

# 6. Cloudflare cache purge (if static assets changed)
```

## Success Criteria
- Vercel build: green (0 errors)
- `/api/health` → HTTP 200
- `/api/chat` → HTTP 200 + streams first token in < 1.5s
