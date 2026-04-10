# /refactor — Suggest & Apply Improvements (Platform)

Analyze target file(s) and suggest/apply clean refactors. Never break working behavior.

## Rules
- One file at a time
- TypeScript strict compliance after refactor
- No behavior changes — structure only unless specified
- Run `npx tsc --noEmit` after every refactor

## Checklist per file
- [ ] Remove `any` types — replace with proper types
- [ ] Extract repeated logic into utility functions in `src/lib/`
- [ ] Server components don't import client-only hooks
- [ ] API routes have full error handling
- [ ] Remove dead code and unused imports
- [ ] Consistent naming: `camelCase` variables, `PascalCase` components
- [ ] No inline styles — Tailwind only

## Output Format
```
REFACTOR PLAN: [filename]
Changes proposed: X
TypeScript improvements: X
Extracted utilities: [list]
Behavior changes: NONE (or describe)

[diff of proposed changes]

Run to apply: [command or approval request]
```
