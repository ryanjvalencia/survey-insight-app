# Project Handoff — Survey Insight
**Date:** 2026-05-14
**Status:** Issues #1–19 complete. Full browser-side MVP pipeline working. Blocked on Supabase configuration for #20–23.

---

## What this project is

A web app that turns messy CSV survey/customer feedback exports into clean insights, charts, and downloadable reports. Target users: consultants, UX researchers, marketing agencies, startup founders.

Full spec: [docs/product-spec.md](product-spec.md)

---

## What has been built (issues #1–19)

The complete end-to-end MVP workflow runs entirely in the browser using sessionStorage. No backend or database yet.

### Data pipeline (`src/lib/`)

| Module | Exported function | Issue |
|---|---|---|
| `src/lib/validate/` | `validateFileMetadata`, `validateCSVContent` | #5 |
| `src/lib/parse/` | `parseCSV` | #6 |
| `src/lib/infer/` | `inferColumnTypes` | #8 |
| `src/lib/schema/` | `validateSchema` | #10 |
| `src/lib/clean/` | `cleanDataset` | #11 |
| `src/lib/analysis/` | `analyzeQuantitative` | #13 |
| `src/lib/text/` | `analyzeText` | #14 |
| `src/lib/charts/` | `buildCharts` | #15 |
| `src/lib/insights/` | `generateInsights` | #17 |
| `src/lib/export/` | `serializeCSV` | #18 |

**186 unit tests, all passing.** Every public data pipeline function has tests.

### UI (`src/app/(app)/projects/[projectId]/`)

| Route | Component | What it does |
|---|---|---|
| `upload/` | `UploadSection` | Drag-and-drop CSV; validates; parses via `parseCSV`; stores `ParseResult` in `sessionStorage` |
| `preview/` | `PreviewTable` | Reads `ParseResult` from sessionStorage; shows first 25 rows |
| `mapping/` | `MappingSection` | Infers column types; lets user override; on "Next: Analyze" runs full pipeline (clean → analyze → insights → charts) and stores results in sessionStorage |
| `analysis/` | `AnalysisDashboard` | Reads sessionStorage; renders cleaning summary table, insight cards, chart blocks |
| `report/` | `ReportSection` | Download cleaned CSV; print-to-PDF via `window.print()` |

### sessionStorage keys (per project)

| Key | Value |
|---|---|
| `preview:${projectId}` | `ParseResult` — raw parsed dataset |
| `mapping:${projectId}` | `ColumnMapping[]` — user-confirmed column types |
| `cleaning:${projectId}` | `CleaningSummary` — counts only, no row data |
| `analysis:${projectId}` | `{ quant, text, insights, charts }` — full analysis payload |

### Shared types (`src/types/index.ts`)

`Project`, `ProjectStatus`, `ColumnType`, `ColumnMapping`, `Dataset`, `ParseResult`, `ValidationCode/Issue/Result`, `SchemaIssueCode/SchemaIssue/SchemaValidationResult`, `ColumnCleaningStats`, `CleaningSummary`, `CleaningResult`

---

## Current file structure

```
src/
  app/
    layout.tsx                   Root layout
    page.tsx                     Landing page (/) — hero, how-it-works, CTAs
    (app)/
      layout.tsx                 App shell — persistent Nav
      dashboard/page.tsx         /dashboard — project list placeholder
      projects/
        new/page.tsx             /projects/new — hardcoded demo redirect
        [projectId]/
          layout.tsx             StepNav only
          upload/
            page.tsx             Server wrapper
            UploadSection.tsx    Client — file picker + pipeline trigger
          preview/
            page.tsx             Server wrapper
            PreviewTable.tsx     Client — renders first 25 rows
          mapping/
            page.tsx             Server wrapper
            MappingSection.tsx   Client — type overrides + full pipeline on Next
          analysis/
            page.tsx             Server wrapper
            AnalysisDashboard.tsx Client — cleaning summary, insights, charts
          report/
            page.tsx             Server wrapper
            ReportSection.tsx    Client — CSV download, print report
  components/
    layout/
      Nav.tsx                    Sticky top nav, active state
      StepNav.tsx                Per-project step strip
      PageHeader.tsx             Page title component
    upload/
      DropZone.tsx               Drag-and-drop file input
  lib/
    validate/index.ts + validate.test.ts
    parse/index.ts + parse.test.ts
    infer/index.ts + infer.test.ts
    schema/index.ts + schema.test.ts
    clean/index.ts + clean.test.ts
    analysis/index.ts + analysis.test.ts
    text/index.ts + text.test.ts
    charts/index.ts + charts.test.ts
    insights/index.ts + insights.test.ts
    export/index.ts + export.test.ts
    data/index.ts                Stub
    smoke.test.ts
  types/index.ts

docs/
  product-spec.md
  roadmap.md                     Issues #1–19 ✅, #20–23 blocked
  architecture.md
  agent-operating-system.md
  agent-prompts.md
  security-privacy.md
  handoff.md                     ← this file
```

---

## Git state

**Branch:** `agent-factory`
**Remote:** pushed to `https://github.com/ryanjvalencia/survey-insight-app`
**Main branch:** still at the original `Add CI checks` commit

**Action required:**
1. Open a PR from `agent-factory` → `main`
2. Review and merge
3. Once merged, configure Supabase (see below) to unblock #20–23

---

## CI status

All four checks pass on `agent-factory`:
```
npm run lint      ✅
npm run typecheck ✅
npm test          ✅  (186 tests across 11 test files)
npm run build     ✅
```

Routes compiled:
```
○ /                              (static)
○ /dashboard                     (static)
○ /projects/new                  (static)
ƒ /projects/[projectId]/upload   (dynamic)
ƒ /projects/[projectId]/preview  (dynamic)
ƒ /projects/[projectId]/mapping  (dynamic)
ƒ /projects/[projectId]/analysis (dynamic)
ƒ /projects/[projectId]/report   (dynamic)
```

---

## What is blocked and why

| # | Issue | Blocker |
|---|---|---|
| #20 | Supabase persistence | Needs Supabase project + credentials from human |
| #21 | Authentication | Depends on #20 |
| #22 | Security & privacy audit | Depends on #21 |
| #23 | Deployment | Depends on #22 |

**To unblock #20:** create a Supabase project and add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable.

The database schema to create (from `docs/product-spec.md`):
```sql
-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  status text not null default 'created',
  created_at timestamptz default now()
);

-- Datasets
create table datasets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects not null,
  original_filename text,
  row_count integer,
  column_count integer,
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table projects enable row level security;
alter table datasets enable row level security;
```

---

## Known limitations (MVP)

| Item | Notes |
|---|---|
| sessionStorage only | All data is browser-tab ephemeral; closing the tab loses the session. Fixed by #20 (Supabase persistence). |
| `projects/new` hardcodes `/projects/demo/upload` | Real project creation requires #20. |
| No deduplication | Cleaning pipeline does not remove duplicate rows. Intentional for MVP scope. |
| Date normalization uses `new Date()` | Local timezone can cause off-by-one on US-format dates. Known limitation. |
| CSV export re-runs cleaning | Cleaned rows not stored separately — cleaning is re-computed on download. Fast enough for ≤50k rows. |
| Word cloud is CSS font-size only | No visual cloud layout. Charts module outputs data; rendering is minimal Tailwind. |
| Print PDF depends on browser | `window.print()` quality varies by browser. No dedicated PDF library. |

---

## How to continue

### Option A — Autonomous loop (paste into new chat)

```
You are the Orchestrator for the Survey Insight agent build system.

Read AGENTS.md, CLAUDE.md, and docs/roadmap.md.

Identify the next unblocked issue. Verify CI is passing.
Then act as each agent role in sequence (steps 1–10 from
docs/agent-operating-system.md), completing each step fully
before moving to the next.

Stop and escalate to me if:
- CI fails at any point
- A HIGH security finding is found
- A new npm dependency is needed
- Any file outside the agent's allowed scope needs to be touched
- Deployment, auth configuration, or payments are involved

Begin now.
```

This will block immediately on #20 and tell you what Supabase credentials are needed.

### Option B — After Supabase is configured

```
/implement-issue #20
```

### Option C — Role-by-role

See [docs/agent-prompts.md](agent-prompts.md) for per-role prompts.

---

## Key architectural decisions

| Decision | Reason |
|---|---|
| All pipeline runs client-side on "Next: Analyze" | No backend yet (Supabase in #20); avoids server-side file handling before auth exists |
| sessionStorage keyed by `${type}:${projectId}` | Supports multiple projects in the same tab; predictable key scheme |
| `useSyncExternalStore` for sessionStorage reads | Avoids `useEffect` + `setState` (blocked by `react-hooks/set-state-in-effect` lint rule); server snapshot returns `null` cleanly |
| `inferColumnTypes` uses name hints first, value stats for confidence | Name is structural metadata (high signal); values might be sparse or misleading alone |
| `cleanDataset` clamps NPS/rating rather than dropping bad rows | Dropping rows loses signal; clamping preserves the response with a bounded value |
| No PDF library — `window.print()` for report | Avoids new npm dependency; browser print is good enough for MVP |
| No AI API calls anywhere | All analysis is rule-based; AI API requires feature flag + sanitization (future issue) |
