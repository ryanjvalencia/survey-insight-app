# Roadmap — Survey Insight

Target audience: consultants analyzing client survey data (stage 1). Stage 2 extends to small businesses analyzing Yelp / Google reviews. See `docs/product-spec.md`.

## Done

- [x] MVP pipeline (formerly issues #1–20): CSV upload and validation, parsing and preview, column type inference and mapping, cleaning, quantitative and text analysis, charts, rule-based insights, CSV export, printable report, Supabase metadata
- [x] Cleanup — removed orchestrator-era scaffolding
- [x] Auth and data ownership — email + password auth, owner-only RLS, server-side database access
- [x] Persist analysis results — aggregated results only; raw rows stay on the device (IndexedDB, 7-day expiry, cleared on sign out)
- [x] Next.js 16.3 (fixes the Turbopack PostCSS worker leak on Windows)
- [x] Design system and redesign — tokens, Inter, hand-built charts, NPS benchmark meter, motion and page transitions
- [x] Plain-language key insights with a spotlight carousel and column-meaning inference

## Next

1. [ ] **Downloadable report cleanup** — print layout, page breaks, charts in the report, branding
2. [ ] **Sentiment analysis testing** — measure the word-list sentiment against labeled review text before stage 2
3. [ ] **Separating consultant and small-business experiences** — post-sign-in home that routes to each, or a "survey vs. reviews" choice at upload
4. [ ] **Time-series analysis** — responses and scores over time for date columns
5. [ ] **XLSX import**
6. [ ] **AI insights behind a feature flag** — with a sanitization layer; see `docs/security-privacy.md`
7. [ ] **Security and privacy review** — against `docs/security-privacy.md`, plus `npm audit`
8. [ ] **Delete and rename projects**
9. [ ] **Animation and design polish**
10. [ ] **Better project library** — search, sort, filter, recent activity

## Before launch

- [ ] Turn Supabase email confirmation back on; password reset
- [ ] Deployment (Vercel) — requires human approval
