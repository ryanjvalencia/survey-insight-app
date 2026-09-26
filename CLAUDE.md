# CLAUDE.md — Survey Insight

Web app that turns messy survey / customer feedback CSV exports into cleaned data, charts, plain-English insights, and a downloadable report. Primary audience: **consultants** analyzing client survey data (small businesses may become a focus later).

- Product spec: `docs/product-spec.md`
- Architecture and module layout: `docs/architecture.md`
- Security and privacy rules: `docs/security-privacy.md`
- Launch checklist: `docs/roadmap.md`

## Tech stack

- Next.js 16 App Router — **this version has breaking API changes; check `node_modules/next/dist/docs/` before writing Next.js code.** `params` is a Promise in pages/layouts and must be awaited.
- React 19, TypeScript strict mode
- Tailwind CSS v4 (no inline styles, no CSS modules)
- Vitest for unit tests (collocated `*.test.ts`)
- Supabase (`@supabase/supabase-js`) for persistence; env vars in `.env.local`

## Checks — all four must pass before a change is done

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

CI (`.github/workflows/ci.yml`) runs the same four on every PR and on push to `main`.

## Conventions

- Business/data logic lives in `src/lib/` as pure, tested functions. UI lives in `src/app/` and `src/components/` and only imports from `src/lib/`.
- Shared domain types go in `src/types/index.ts`.
- Database access is server-only: Server Components / Server Actions with `createSupabaseServerClient()` from `src/lib/supabase/server.ts`, passed into `src/lib/db/*` functions. Never query Supabase from client components. Re-validate all browser input in Server Actions.
- Schema changes go in `supabase/migrations/` as idempotent SQL; the human runs them in the Supabase SQL Editor.
- Server Components by default; `"use client"` only when hooks or browser APIs are needed.
- `next/link` for internal navigation.
- Every new `src/lib/` function gets at least one unit test, using synthetic fixtures only.
- New npm dependencies need a stated reason in the commit/PR description.

## Privacy rules — non-negotiable

- Treat every uploaded file as sensitive PII.
- Never log, persist, or put in error messages any raw row data, cell values, or open-text responses. Messages use counts and percentages only.
- Never send user-uploaded text to an AI API without a feature flag and a sanitization layer.
- Never commit secrets or `.env*` files. `SUPABASE_SERVICE_ROLE_KEY` must never be in a `NEXT_PUBLIC_` variable.
- Every Supabase table has RLS enabled.

## Ask the human first

Production deploys, DNS, billing/payments, new external services, and anything requiring a secret.
