# Roadmap — Survey Insight

Target audience: consultants analyzing client survey data. See `docs/product-spec.md`.

## Done — MVP pipeline (formerly issues #1–20)

- [x] Landing page, dashboard shell, project creation
- [x] CSV upload with client-side validation (10 MB / 50k rows)
- [x] RFC 4180 CSV parsing and 25-row preview
- [x] Column type inference and user-confirmed column mapping
- [x] Schema validation and data cleaning pipeline with cleaning summary
- [x] Quantitative analysis (NPS, rating, numeric, category) and text analysis (word frequency, length, proxy sentiment)
- [x] Chart specs, rule-based insights, analysis dashboard
- [x] Cleaned CSV export and printable report
- [x] Supabase persistence for project and dataset metadata

## Next — path to launch

1. [x] **Cleanup and merge** — remove orchestrator-era scaffolding, merge `agent-factory` into `main`
2. [x] **Auth and data ownership**
   - Supabase email + password auth; protect `(app)` routes
   - Add `user_id` to `projects`; replace permissive RLS with `auth.uid() = user_id` policies
   - Check the uploaded dataset against the logged-in user before saving
   - Don't let a failing database call in upload look like a file read error
3. [ ] **Persist analysis results** — store aggregated results (no raw rows) so reopening a project from the dashboard works after the tab is closed
4. [ ] **Consultant-ready presentation**
   - Visual polish and branding across the app
   - Real chart library for the dashboard
   - Client-ready PDF report (branding, cover page, clean layout)
   - Date / time-series analysis (in spec, not yet built)
5. [ ] **Nice to have** — XLSX import; AI-generated summaries behind a feature flag with sanitization
6. [ ] **Security and privacy review** against `docs/security-privacy.md`
7. [ ] **Deployment** (Vercel) — requires human approval
