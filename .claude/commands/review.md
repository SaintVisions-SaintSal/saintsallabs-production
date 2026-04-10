# /review — Code Review (Platform)

Run a full code review on the current diff before any PR or deploy.

## Steps

1. Run `git diff main` and capture all changed files
2. For each changed file, check:
   - TypeScript strict compliance (no `any` types)
   - No secrets or API keys in code
   - Error handling in all API routes
   - Supabase RLS policies for new tables
   - shadcn/ui component patterns followed
   - Server vs client component distinction correct
3. Run `npx tsc --noEmit` and report all errors
4. Check bundle impact of any new dependencies
5. Verify `.env.example` updated for any new env vars

## Output Format

```
REVIEW SUMMARY
==============
Files changed: X
TypeScript errors: X
Security issues: X (BLOCKS MERGE if > 0)
Missing RLS policies: X (BLOCKS MERGE if > 0)
Bundle warnings: X

ISSUES:
[file:line] — description of issue — severity: CRITICAL|WARNING|INFO

VERDICT: APPROVED | BLOCKED (reason)
```
