# Roadmap — Survey Insight

**Stage 1:** consultants analyzing client survey data. **Stage 2 (planned):** small businesses analyzing their Yelp / Google reviews. See `docs/product-spec.md`.

## Done

- [x] MVP pipeline (formerly issues #1–20): CSV upload and validation, parsing and preview, column type inference and mapping, cleaning, quantitative and text analysis, charts, rule-based insights, CSV export, printable report, Supabase metadata
- [x] Cleanup — removed orchestrator-era scaffolding
- [x] Auth and data ownership — email + password auth, owner-only RLS, server-side database access
- [x] Persist analysis results — aggregated results only; raw rows stay on the device (IndexedDB, 7-day expiry, cleared on sign out)
- [x] Next.js 16.3 (fixes the Turbopack PostCSS worker leak on Windows)
- [x] Design system and redesign — tokens, Inter, hand-built charts, NPS benchmark meter, motion and page transitions
- [x] Plain-language key insights with a spotlight carousel and column-meaning inference
- [x] All feature branches merged to `main` (PRs through #10)

## Next — in this order

Each item has a "done when" so it has a clear finish line.

### 1. Trust basics (before any real client data)

- [ ] **Security and privacy review** against `docs/security-privacy.md`: every Server Action, RLS policies, `npm audit`, headers.
  *Done when:* no HIGH findings; MEDIUM/LOW logged.
- [ ] **Delete and rename projects** — deleting also removes datasets, analysis results, and the project's local browser data.
  *Done when:* a user can rename or permanently delete a project from the project library.
- [ ] **Password reset** and **account deletion** (removes all of the user's projects).
- [ ] **Turn Supabase email confirmation back on.**

### 2. Consultant deliverable, then real users

- [ ] **Downloadable report cleanup** — decide print CSS vs. a generated PDF; branding.
  *Done when:* the report prints on standard pages with no split charts, and includes the NPS meter and the top 3 charts.
- [ ] **XLSX import** — needs a spreadsheet-parsing dependency: choose a maintained one (note: SheetJS no longer publishes to npm), pin the version, and include it in the security review.
  *Done when:* a `.xlsx` with one sheet goes through the same flow as a CSV.
- [ ] **Deploy (Vercel)** — requires human approval; add error monitoring.
- [ ] **Put it in front of 2–3 consultants** and use their feedback to scope design polish and the project library.
- [ ] **Browser tests** — a handful of Playwright click-through tests of the golden path (sign up → upload → analyze → report) to catch visual regressions.

### 3. Stage 2 groundwork (validate before building)

- [ ] **Confirm how businesses can get their reviews in.** This is the biggest stage 2 risk. As last checked: Yelp's API returns only a few review excerpts and restricts storing them; Google's public Places API returns about 5 reviews per place; owners can reach their full Google reviews through their Business Profile; scraping breaks both sites' terms. Re-check current terms.
  *Done when:* there is a documented, terms-compliant way for a small business to export or connect its reviews — or a decision not to proceed.
- [ ] **Sentiment accuracy test.** The current sentiment is a word list and will miss negation ("not good") and sarcasm. Test it on a public review dataset with star ratings, using stars as the ground truth.
  *Done when:* measured against a pass mark agreed up front (e.g. agrees with the star rating ≥ 80% of the time).
- [ ] **AI insights behind a feature flag** — only if the sentiment test fails the pass mark. Requires the sanitization layer from `docs/security-privacy.md`; off by default.

### 4. Stage 2 build

- [ ] **Project types instead of separate apps.** Choose "Survey" or "Reviews" when creating a project; one account and one project library, filterable by type; the logo goes to the project library when signed in. (Revisit a separate home screen that routes to two apps only if the products clearly diverge.)
- [ ] **Better project library** — search, sort, filter by type, recent activity. Built together with project types.
- [ ] **Time-series analysis** — scores and volume over time for date columns (most valuable for reviews: "are we improving month to month?").
  *Done when:* a date column produces a trend chart and a trend insight.

### 5. Ongoing

- [ ] **Animation and design polish**, guided by user feedback rather than done in isolation.
