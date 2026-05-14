# Security and Privacy Rules — Survey Insight

This document defines the hard rules that every agent must follow. The Security/Privacy Agent uses this as their review checklist. All other agents must read this before touching code that handles user data.

Non-compliance with any rule marked **HARD BLOCK** is a HIGH severity finding that prevents PR merge.

---

## 1. Secrets and credentials

| Rule | Severity |
|---|---|
| Never commit API keys, tokens, passwords, or JWTs to the repo | HARD BLOCK |
| Never put secrets in `NEXT_PUBLIC_` environment variables | HARD BLOCK |
| Never hardcode a Supabase service role key in any client-accessible file | HARD BLOCK |
| `.env` and `.env.local` files must be in `.gitignore` | HARD BLOCK |
| All required environment variables must be documented in `README.md` with placeholder values only | Required |

**Pattern to watch for in diffs:**
```
supabase.createClient("https://...", "eyJ...")  ← hardcoded key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY          ← secret exposed to client
```

---

## 2. Raw user data logging

| Rule | Severity |
|---|---|
| Never call `console.log`, `console.error`, `console.warn`, or `logger.*` with row data | HARD BLOCK |
| Never include cell values in error messages returned to the client | HARD BLOCK |
| Never include open-text responses in server logs | HARD BLOCK |
| Anomaly reports must describe the type of anomaly, not the cell value | HARD BLOCK |

**What is "raw user data":** Any value from an uploaded CSV file — cell content, row data, open-text responses, filenames that contain PII.

**Allowed logging:**
```typescript
// ✅ OK — count only
console.log(`Parsed ${result.rowCount} rows`);

// ✅ OK — column name only, not cell value
logger.warn(`Out-of-range value in column "${columnName}"`);

// ❌ HARD BLOCK — cell value in log
console.log(`Invalid value: ${cellValue}`);
```

---

## 3. File upload safety

| Rule | Severity |
|---|---|
| MIME type must be validated server-side, not just client-side | HARD BLOCK |
| File size limit (10 MB) must be enforced server-side | HARD BLOCK |
| Uploaded files must never be stored on disk permanently in an uncontrolled path | HARD BLOCK |
| Filenames must be sanitized before use in `Content-Disposition` headers | HARD BLOCK |
| Path traversal must be impossible in any filename-handling code | HARD BLOCK |
| Client-side validation is allowed as UX only — never as the sole security control | Required |

**Filename sanitization:**
```typescript
// ❌ HARD BLOCK — unsanitized filename in header
res.setHeader('Content-Disposition', `attachment; filename="${userFilename}"`);

// ✅ OK — sanitized
const safe = userFilename.replace(/[^\w.\-]/g, '_');
res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
```

---

## 4. Database and persistence

| Rule | Severity |
|---|---|
| Raw CSV rows must never be stored in the database | HARD BLOCK |
| Open-text responses must never be stored in the database in V1 | HARD BLOCK |
| Only aggregated analysis results (counts, averages, distributions) may be persisted | HARD BLOCK |
| Row-level security (RLS) must be enabled on all Supabase tables | HARD BLOCK |
| Every RLS policy must restrict to `auth.uid() = user_id` | HARD BLOCK |
| The Supabase service role key must only be used in server-side code | HARD BLOCK |
| Database queries must use parameterized queries — no string interpolation | HARD BLOCK |

**RLS verification:** After adding any new table, verify in the Supabase dashboard that RLS is enabled and the `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies are all set to `auth.uid() = user_id`.

---

## 5. Authentication and session management

| Rule | Severity |
|---|---|
| Auth tokens must be stored in httpOnly cookies, not localStorage | HARD BLOCK |
| All `/projects/*` and `/upload` routes must be protected by middleware | HARD BLOCK |
| Session validation must happen in middleware before any data is accessed | HARD BLOCK |
| Error messages for invalid credentials must be generic — do not confirm whether an email exists | Required |
| Password reset flows must use time-limited tokens | Required |

---

## 6. AI API data handling

| Rule | Severity |
|---|---|
| No user data may be sent to an AI API in V1 | HARD BLOCK |
| When AI features are added (post-V1), user text must be sanitized before sending | HARD BLOCK |
| AI features that process user data must be behind an explicit feature flag | HARD BLOCK |
| The AI API key must never appear in client-side code | HARD BLOCK |
| Responses from AI APIs must be validated before rendering in the UI (prompt injection risk) | Required |

---

## 7. API route security

| Rule | Severity |
|---|---|
| Every Route Handler that reads or writes user data must validate the session first | HARD BLOCK |
| Route Handlers must return 401 (not 403) for unauthenticated requests to avoid leaking resource existence | Required |
| No Route Handler may accept arbitrary file paths as parameters | HARD BLOCK |
| Export endpoints must verify the requesting user owns the resource being exported | HARD BLOCK |

---

## 8. Client-side safety

| Rule | Severity |
|---|---|
| Open-text responses must never be rendered in page `<title>`, meta tags, or URL params | HARD BLOCK |
| Insight text must contain aggregates only — no cell values | HARD BLOCK |
| No user-provided string may be rendered as raw HTML (XSS risk) | HARD BLOCK |

---

## 9. Dependency safety

| Rule | Severity |
|---|---|
| `npm audit` must show 0 high/critical vulnerabilities before deployment | HARD BLOCK |
| No new dependency may be added without a written justification in the PR | Required |
| Dependencies that parse untrusted input (CSV parsers, XML parsers) must be pinned to a specific version | Required |

---

## Security review trigger conditions

The Security/Privacy Agent must review any PR that contains changes to:

- `src/app/api/**` (all Route Handlers)
- `src/lib/upload/**`
- `src/lib/parse/**`
- `src/lib/export/**`
- `src/lib/db/**`
- `src/middleware.ts`
- `supabase/migrations/**`
- Any file that calls an external API
- Any file that touches `process.env`
- Any new `npm install`

---

## Privacy impact assessment

Before implementing any feature that touches user data, answer these questions:

1. What user data does this feature access?
2. Is that data stored anywhere? If so, where and for how long?
3. Could a bug expose one user's data to another user?
4. Is any data sent to a third party? Which one, and under what terms?
5. What is the minimum data required for this feature to work?

If the answer to question 3 or 4 involves user-uploaded content, escalate to the human before implementing.
