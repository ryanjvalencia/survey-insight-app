# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Key insights spotlight on the analysis page: one insight at a time in large type with a featured figure, tone-coded (strength / needs attention / observation), arrow buttons, progress segments, keyboard and swipe navigation, and an "All" grid view.
- Column meaning inference (`src/lib/insights/columns.ts`): readable phrases instead of quoted column names ("annual revenue"), and money columns (revenue, income, salary, price, cost, spend, …) formatted as dollars with commas. Full-question headers are left as written.
- `formatCurrency` in `src/lib/format`.
- Redesign: design tokens (warm neutral surfaces, brand blue shared with charts, validated colorblind-safe chart palette, reserved status colors), Inter font, shared UI recipes and icon set, and a documented design system (`docs/architecture.md`).
- Real charts without a chart library: histograms with readable compact axis labels (e.g. 25.5K), rating distributions, donut charts (top 5 + Other, legend with values), a top-words bar list, and an NPS meter that places the score on a −100…+100 benchmark track with the promoter/passive/detractor split. Every chart has hover/focus tooltips and a "Show data table" view.
- Motion: animated upload drop zone and a live processing checklist, directional page transitions through the workflow (React View Transitions) and crossfades elsewhere, staggered card and chart entrances; all disabled for reduced-motion users.
- Redesigned landing page (consultant-focused), split-screen sign in/up, project card grid, workflow stepper, KPI tiles and insight cards on the analysis page, and a branded printable report.
- `src/lib/format`: `compactNumber`, `formatCount`, `formatNumber`, `formatPercent`, `niceTicks`, `humanizeColumn`.
- `scripts/generate-test-csv.mjs`: generates synthetic, deliberately messy survey CSVs (10k, 50k, 50,001 rows by default, or any row count) into gitignored `test-data/`.
- Analysis results are saved to the account (`analysis_results` table, `supabase/migrations/20260926010000_analysis_results.sql`), so reopening a project from the dashboard shows its analysis and report after the tab is closed. Re-analyzing replaces the saved result.
- `src/lib/results`: `buildStoredAnalysis` / `parseStoredAnalysis` — versioned payload, server-side validation, 512 KB limit. `src/lib/db/analysis.ts`: `saveAnalysisResult`, `getAnalysisResult`.
- Email + password authentication with `@supabase/ssr` 0.12.7 — the official Supabase package for cookie-based sessions in Next.js server code. `/login` and `/signup` pages, sign-out in the nav, `src/proxy.ts` protecting `/dashboard` and `/projects/**`.
- Project pages 404 for malformed ids and projects the user doesn't own.
- Supabase persistence (#20) — `@supabase/supabase-js` installed; `src/lib/supabase/client.ts` singleton client; `src/lib/db/projects.ts` (createProject, getProject, listProjects, updateProjectStatus) and `src/lib/db/datasets.ts` (saveDataset); 13 unit tests for all DB functions. Project creation now writes to Supabase via a Server Action; dashboard fetches live project list; upload step persists dataset metadata (row count, column count, sanitized filename — no raw rows); mapping step updates project status to `analyzed`. RLS enabled on both tables with open policies for pre-auth phase.
- Report page (`src/app/(app)/projects/[projectId]/report/`) — `ReportSection` renders printable insights/stats summary and wires CSV download (re-runs cleaning from sessionStorage) and print-to-PDF via `window.print()` (#18, #19)
- Analysis dashboard (`src/app/(app)/projects/[projectId]/analysis/`) — `AnalysisDashboard` client component reads sessionStorage and renders cleaning summary, rule-based insights, and charts (NPS gauge, rating/numeric bar charts, category frequency table, word cloud); `MappingSection` updated to run the full pipeline on "Next: Analyze" (#12, #16)
- Chart transformations module (`src/lib/charts/index.ts`) — `buildCharts` converts analysis results into `ChartSpec` objects: NPS gauge, rating bar, numeric histogram (10 buckets), category pie (top 10 + Other), and word-cloud weight data (#15)
- Insight generation module (`src/lib/insights/index.ts`) — `generateInsights` produces rule-based `Insight[]` with severity labels and a summary string; covers NPS, rating, numeric, category, and text columns; no AI API calls (#17)
- Quantitative analysis module (`src/lib/analysis/index.ts`) — `analyzeQuantitative` computes NPS score/segments, rating distributions, numeric mean/median/stdDev, and category frequencies from cleaned datasets (#13)
- Text analysis module (`src/lib/text/index.ts`) — `analyzeText` computes word frequencies (stop-word filtered), response length stats, and proxy sentiment (word-list based, no AI API) for `open_text` columns (#14)
- Data cleaning pipeline (`src/lib/clean/index.ts`) — `cleanDataset(dataset, mappings)` trims whitespace, clamps NPS/rating out-of-range values, normalizes numeric formatting (`$£€,` stripped) and dates to ISO `YYYY-MM-DD`, and nullifies unparseable values; returns `CleaningResult` with cleaned dataset and per-column `CleaningSummary` (#11)
- Schema validation module (`src/lib/schema/index.ts`) — `validateSchema(dataset, mappings)` checks for empty columns, low fill rate, and invalid values per column type (NPS 0–10, positive-integer rating, numeric, parseable date); returns `SchemaValidationResult` with per-column `SchemaIssue[]`; never logs or returns cell values (#10)
- Column mapping screen — `MappingSection` client component reads `ParseResult` from sessionStorage, infers column types via `inferColumnTypes`, and allows users to override each column's type via a dropdown; confidence badges (high/med/low) signal inference quality; saves final `ColumnMapping[]` to `mapping:${projectId}` in sessionStorage before advancing (#9)
- Column type inference module (`src/lib/infer/index.ts`) — `inferColumnTypes` infers NPS, rating, numeric, date, category, open_text, id, or unknown for each column using name heuristics and value sampling; returns `ColumnMapping[]` with confidence scores (#8)
- Data preview screen — upload step parses CSV in the browser, stores `ParseResult` in `sessionStorage`; preview page renders first 25 rows with column headers, row/column count, and parse warnings (#7)
- `PreviewTable` client component (`src/app/(app)/projects/[projectId]/preview/PreviewTable.tsx`) using `useSyncExternalStore` for hydration-safe sessionStorage reads (#7)
- Dashboard shell (`src/app/(app)/layout.tsx`) — persistent app nav wrapping all app routes via route group, landing page excluded (#3)
- `Nav` component (`src/components/layout/Nav.tsx`) — sticky top nav with active-state highlighting via `usePathname` (#3)
- `StepNav` component (`src/components/layout/StepNav.tsx`) — per-project workflow step strip with active step highlighting (#3)
- `docs/architecture.md` — route structure, component conventions, module layout

### Changed
- Insights rewritten in plain language that leads with meaning and a next step: headline + explanation + featured metric, sorted most important first. NPS is framed as "would recommend vs. wouldn't" with its benchmark band; ratings report top-box/bottom-box shares on the inferred scale; numbers lead with the typical (median) value, rounded in headlines, and flag skewed averages; evenly split categories are combined into one "balanced sample" insight; comment sentiment and top words are one insight.
- Insights are regenerated from stored aggregates when the analysis and report pages load, so existing projects show the new wording without re-running.
- Pie charts show at most 6 slices (top 5 + Other, derived from the column total) instead of 11.
- Analysis and report pages load results on the server; `AnalysisDashboard` is now a Server Component.
- "Next: Analyze" shows an error and stays on the page if results can't be saved, instead of continuing silently.
- The report explains that the cleaned CSV needs the file re-uploaded when the raw data isn't in the current tab (raw rows are never stored server-side).
- `CLAUDE.md` rewritten as a concise project guide; `docs/roadmap.md` replaced with a launch checklist; PR template, security doc, and `/qa-workflow` skill no longer reference agent roles
- `docs/architecture.md` now holds the sessionStorage keys, DB schema, design decisions, and known limitations (previously in `docs/handoff.md`)
- Product spec names consultants as the primary audience
- CI runs on Node 24 (Node 20 is end-of-life)
- `dashboard/` and `projects/` moved into `(app)/` route group — URLs unchanged (#3)
- `[projectId]/layout.tsx` — removed redundant nav header, now delegates to `StepNav` (#3)
- `README.md` — replaced Next.js boilerplate with project-specific setup instructions

### Fixed
- The global stylesheet forced Arial over the loaded font and applied a partial dark-mode background; both removed.
- Numeric histograms showed 0 in every bin: bins were built from min/max only with hard-coded zero counts. Analysis now counts values into 10 equal-width bins (`histogramBins`, stored as `NumericResult.bins`) and charts use those counts. Labels use thousands separators for large values. Projects analyzed before this fix need re-analyzing to populate their histograms.
- Columns with currency or thousands-separated values (`$1,234`, `€99.50`, `12,000`) are now detected as Numeric instead of Unknown.
- Column type choices on the mapping step are saved on every change and restored when returning to the step (previously lost when navigating between steps).
- Files up to the advertised 10 MB / 50,000 rows now work: raw rows moved from `sessionStorage` (~5M character cap, which a ~15–20k-row file already exceeded) to IndexedDB.
- NPS is shown with its −100 to +100 scale, a sign (+17.6), and the average 0–10 answer; the bare number read as out of range. The calculation itself was correct.
- Upload now enforces the row limit and empty/header checks using the parsed row count (`validateParsedDataset`); previously `validateCSVContent` existed but was never called, so a 50,001-row file failed later with "Invalid upload details." Line-based counting also over-counted quoted multi-line fields.
- Upload shows a specific message when the browser blocks local storage instead of "Failed to read the file".
- Next.js upgraded 16.2.6 → 16.3.6: Turbopack dev server on Windows spawned unbounded PostCSS workers (~2,000 processes, ~18 GB RAM), freezing the machine.
- Upload no longer reports a database failure as "Failed to read the file".
- Dashboard shows an error instead of an empty project list when projects fail to load.

### Removed
- Multi-agent orchestrator scaffolding (`AGENTS.md`, agent operating-system/prompt docs, issue generator script, `/implement-issue` and `/review-pr` skills, agent-task issue template, `src/lib/data` stub)

### Security
- Raw uploaded rows stay on the device in IndexedDB, expire after 7 days, and are cleared on sign out.
- Data minimization for stored analysis: the full per-word vocabulary from open-text answers is dropped (only the displayed top 20 words are kept) and category frequency tables are capped at 20 values, enforced server-side. RLS on `analysis_results` follows parent-project ownership.
- Per-user data ownership: `projects.user_id` defaults to `auth.uid()` and is required; permissive RLS replaced with owner-only policies on `projects` and `datasets` (`supabase/migrations/20260926000000_user_scoped_rls.sql`). The migration deletes pre-auth ownerless projects.
- All database access moved server-side (Server Components / Server Actions); the browser no longer queries Supabase. Server Actions re-validate upload metadata (`parseDatasetMeta`) and project ids (`isUuid`).
- Post-login redirect targets are sanitized (`safeRedirectPath`) to prevent open redirects.

---

## [0.1.0] — 2026-05-14

### Added
- Base project structure: single-root Next.js 16 App Router project with `src/` layout (#1)
- TypeScript strict mode, Vitest, all four CI scripts (`lint`, `typecheck`, `test`, `build`) (#1)
- Placeholder workflow pages: `/`, `/dashboard`, `/projects/new`, `/projects/[id]/{upload,preview,mapping,analysis,report}` (#1)
- `PageHeader` component, `src/types/index.ts`, `src/lib/data/index.ts` (#1)
- Agent operating system: `AGENTS.md`, `CLAUDE.md`, `docs/roadmap.md`, `docs/agent-operating-system.md`, `docs/agent-prompts.md`, `docs/security-privacy.md`
- GitHub templates: agent-task issue form, bug report form, PR template
- Claude Code skills: `/implement-issue`, `/review-pr`, `/qa-workflow`
