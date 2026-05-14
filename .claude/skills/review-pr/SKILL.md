# Skill: /review-pr

Performs the Security/Privacy Agent review pass on a completed PR before human approval. Run this after the Test Agent and QA Agent have both signed off.

## Usage

```
/review-pr #<pr-number>
```

Or for a local branch without a PR yet:

```
/review-pr --branch <branch-name>
```

---

## What this skill does

1. Reads `docs/security-privacy.md` in full.
2. Reads every file changed in the PR diff.
3. Checks each file against the security and privacy rules.
4. Assigns a severity (HIGH / MEDIUM / LOW) to each finding.
5. Reports a structured review output.
6. HIGH findings block the PR — they must be resolved before merge.
7. MEDIUM and LOW findings are filed as follow-up GitHub issues.

---

## Review checklist

Work through each section. Mark PASS or flag a finding with severity.

### Secrets
- [ ] No API keys, tokens, or passwords committed
- [ ] No secrets in `NEXT_PUBLIC_` variables
- [ ] No Supabase service role key in client-accessible code
- [ ] `.env` files are in `.gitignore`

### Data logging
- [ ] No `console.log` with cell values or row data
- [ ] No cell values in error messages returned to the client
- [ ] No open-text responses in server logs
- [ ] Anomaly reports describe types, not values

### File upload
- [ ] MIME type validated server-side
- [ ] File size enforced server-side
- [ ] `Content-Disposition` filename sanitized
- [ ] No path traversal possible in filename handling

### Database
- [ ] Raw CSV rows not stored in database
- [ ] RLS enabled on all new tables
- [ ] RLS policies check `auth.uid() = user_id`
- [ ] Parameterized queries used (no string interpolation in SQL)
- [ ] Service role key used server-side only

### Authentication
- [ ] Auth tokens in httpOnly cookies, not localStorage
- [ ] Protected routes guarded by middleware
- [ ] Session validated before data access
- [ ] Login error messages are generic

### AI API (if applicable)
- [ ] No user data sent to AI API in V1
- [ ] If post-V1: sanitization layer exists before AI call
- [ ] Feature flag controls AI data processing
- [ ] AI API key not in client bundle

### API routes
- [ ] Session validated at start of every Route Handler
- [ ] No arbitrary file paths accepted as parameters
- [ ] Export endpoints verify resource ownership

### Client-side
- [ ] Open-text not in page title or meta tags
- [ ] No user string rendered as raw HTML
- [ ] Insight text contains aggregates only

### Dependencies
- [ ] `npm audit` shows 0 high/critical
- [ ] Any new dependency has a written justification

---

## Output format

```
SECURITY REVIEW — PR #<n> — <title>
Reviewed by: Security/Privacy Agent
Date: <date>

OVERALL: PASS | FINDINGS

HIGH (blocks PR):
- <file>:<line> — <description>

MEDIUM (follow-up issues):
- <file>:<line> — <description>

LOW (follow-up issues):
- <file>:<line> — <description>

PRIVACY REVIEW:
- Raw data logging: PASS | <finding>
- Data storage: PASS | <finding>
- AI data handling: PASS | N/A | <finding>

VERDICT: APPROVED FOR MERGE | BLOCKED — fix HIGH findings first
```

---

## What this skill does NOT do

- Implement fixes (report findings only; assign to the relevant builder agent)
- Review UI aesthetics or performance
- Replace the human's final review
