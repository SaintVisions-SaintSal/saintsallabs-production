# /document — Auto-Generate Docs (Platform)

Generate or update documentation for a file, route, or module.

## Steps

1. Read the target file(s)
2. Generate JSDoc/TSDoc comments for all exported functions
3. Update `docs/api-reference.md` with any new or changed API routes
4. Update `docs/architecture.md` if structural changes were made
5. Ensure `.env.example` documents all environment variables used

## Format for API Routes

```markdown
### POST /api/[route]

**Auth required:** Yes | No
**Rate limited:** Yes | No

**Request body:**
\`\`\`json
{ "field": "type — description" }
\`\`\`

**Response:**
\`\`\`json
{ "data": "...", "error": null }
\`\`\`

**Errors:**
- 401: Unauthorized
- 400: Bad request — [reason]
- 500: Internal server error
```
