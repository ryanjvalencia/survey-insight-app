# Pull Request

## Summary

<!-- 2–4 sentences: what changed, why it matters, any notable decisions. -->

## How to test manually

1. `npm run dev`
2. Go to `http://localhost:3000/...`
3. ...

## CI checklist

- [ ] `npm run lint` exits 0
- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0
- [ ] `npm run build` exits 0

## Security and privacy checklist

- [ ] No secrets, API keys, or tokens committed
- [ ] No raw row data or cell values in any log, error message, or database write
- [ ] No user data sent to an external API without a feature flag and sanitization
- [ ] File upload: MIME type and size validated server-side (if applicable)
- [ ] `Content-Disposition` filename sanitized (if applicable)
- [ ] Route Handlers / Server Actions validate the session (if applicable)
- [ ] Supabase RLS enabled and user-scoped on any new tables (if applicable)

## Test checklist

- [ ] Every new `src/lib/` function has at least one unit test
- [ ] Edge cases covered: null input, empty file, malformed data, boundary values
- [ ] No test uses real user data — synthetic fixtures only

## New dependencies

<!-- None, or package@version — reason. -->

## Known limitations

## Screenshots (if UI changed)
