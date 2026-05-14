# Pull Request

## Issue

Closes #<!-- issue number -->

## Summary

<!-- 2–4 sentences: what was built, why it matters, any notable decisions made. -->

## Files changed

<!-- List every file created or modified. Agents: include your role next to each file. -->

| File | Change | Agent role |
|---|---|---|
| `src/lib/parse/parse-csv.ts` | Created | Data Pipeline |
| `src/types/index.ts` | Modified — added ParseResult | Data Pipeline |

## How to test manually

<!-- Step-by-step instructions. Assume the reviewer has a clean checkout. -->

1. `npm run dev`
2. Go to `http://localhost:3000/...`
3. ...

## CI checklist

All four must be checked before requesting review.

- [ ] `npm run lint` exits 0
- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0
- [ ] `npm run build` exits 0

## Security and privacy checklist

- [ ] No secrets, API keys, or tokens committed
- [ ] No raw row data or cell values in any `console.log` or server log
- [ ] No user data sent to an external API without a feature flag and sanitization
- [ ] File upload: MIME type and size validated server-side (if applicable)
- [ ] `Content-Disposition` filename sanitized (if applicable)
- [ ] Route Handlers validate session before processing (if applicable)
- [ ] Supabase RLS enabled on any new tables (if applicable)
- [ ] Security/Privacy Agent has reviewed (required if any security box above is N/A or this issue touches upload/auth/export/AI)

## Test checklist

- [ ] Every new data pipeline function has at least one unit test
- [ ] Edge cases covered: null input, empty file, malformed data, boundary values
- [ ] No test uses real user data — synthetic fixtures only

## Agent handoffs completed

- [ ] Frontend Agent handoff (if applicable)
- [ ] Data Pipeline Agent handoff (if applicable)
- [ ] Test Agent handoff
- [ ] Security/Privacy Agent handoff (if triggered)
- [ ] QA Agent workflow walkthrough
- [ ] Documentation Agent — docs and CHANGELOG updated

## Known limitations

<!-- Anything intentionally left out of scope for this PR. Link follow-up issues if they exist. -->

## Screenshots (if UI changed)

<!-- Before / after, or just after if it's a new page. -->
