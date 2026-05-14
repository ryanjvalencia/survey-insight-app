# Roadmap — Survey Insight MVP

Ordered by dependency. Each issue must reach `done` before dependent issues begin.
Status values: `done` | `in-progress` | `not-started` | `blocked`

---

## Status legend

| Symbol | Meaning |
|---|---|
| ✅ | done |
| 🔄 | in-progress |
| ⬜ | not-started |
| 🔴 | blocked |

---

## Issue list

| # | Title | Status | Depends on | Agent | Complexity |
|---|---|---|---|---|---|
| 1 | Base project structure | ✅ done | — | Frontend | Small |
| 2 | Landing page | ✅ done | #1 | Frontend | Small |
| 3 | Dashboard shell | ✅ done | #1 | Frontend | Small |
| 4 | Upload page UI | ✅ done | #3 | Frontend | Medium |
| 5 | CSV validation | ✅ done | #1 | Data Pipeline | Small–Medium |
| 6 | CSV parsing | ✅ done | #5 | Data Pipeline | Medium |
| 7 | Data preview screen | ✅ done | #6 | Frontend | Medium |
| 8 | Column type inference | ✅ done | #6 | Data Pipeline | Medium |
| 9 | Column mapping screen | ✅ done | #7, #8 | Frontend | Medium |
| 10 | Schema validation | ✅ done | #6, #8, #9 | Data Pipeline | Small–Medium |
| 11 | Data cleaning pipeline | ✅ done | #6, #10 | Data Pipeline | Large |
| 12 | Cleaning summary UI | ⬜ not-started | #11 | Frontend | Medium |
| 13 | Quantitative analysis | ✅ done | #11 | Data Pipeline | Large |
| 14 | Text analysis | ✅ done | #11 | Data Pipeline | Medium |
| 15 | Chart transformations | ✅ done | #13, #14 | Data Pipeline | Medium |
| 16 | Analysis dashboard | ⬜ not-started | #15, #3 | Frontend | Large |
| 17 | Insight generation | ✅ done | #13, #14 | Data Pipeline | Medium |
| 18 | Cleaned CSV export | ⬜ not-started | #11, #16 | Data Pipeline | Small–Medium |
| 19 | Report export | ⬜ not-started | #13, #14, #17, #18 | Data Pipeline | Large |
| 20 | Supabase persistence | ⬜ not-started | #1, #11, #13 | Data Pipeline | Large |
| 21 | Authentication | ⬜ not-started | #20 | Frontend + Data Pipeline | Medium |
| 22 | Security and privacy audit | ⬜ not-started | #21, #5–#19 | Security/Privacy | Large |
| 23 | Deployment | ⬜ not-started | #22 | Release | Medium |

---

## Dependency graph

```
#1 Base structure
├── #2 Landing page
├── #3 Dashboard shell
│   ├── #4 Upload page UI
│   └── #16 Analysis dashboard ──────────────┐
├── #5 CSV validation                         │
│   └── #6 CSV parsing                        │
│       ├── #7 Data preview                   │
│       │   └── #9 Column mapping ────────┐   │
│       ├── #8 Column type inference ─────┤   │
│       │   └── #9 Column mapping ────────┤   │
│       └── #10 Schema validation ◄───────┘   │
│           └── #11 Data cleaning             │
│               ├── #12 Cleaning summary UI   │
│               ├── #13 Quantitative analysis ├── #15 Chart transforms ──► #16
│               │   ├── #17 Insight gen       │
│               │   └── #18 CSV export        │
│               │       └── #19 Report export │
│               └── #14 Text analysis ────────┘
│                   ├── #17 Insight gen
│                   └── #19 Report export
├── #20 Supabase persistence
│   └── #21 Authentication
│       └── #22 Security audit
│           └── #23 Deployment
```

---

## Current sprint

**Next unblocked issues (ready to start):**
- #12 Cleaning summary UI (depends on #11 ✅) — Frontend
- #16 Analysis dashboard (depends on #15 ✅, #3 ✅) — Frontend

**Recommended start order:** #12 (Frontend), then #16 (Frontend) after #12 is done.

---

## Completed issues

### ✅ #17 — Insight generation
- `generateInsights(quant, text)` exported from `src/lib/insights/index.ts`
- Rule-based, deterministic — no AI API calls
- NPS: score severity (positive/neutral/negative), high-detractor alert (>40%), strong-promoter alert (>60%)
- Rating: mean insight with severity based on threshold (≥4 positive, ≥2.5 neutral)
- Numeric: mean insight; high-variability alert when stdDev > 50% of mean
- Category: top-value insight with count and percentage
- Text: sentiment insight (positive/negative/neutral classification) + top-words insight
- Returns `InsightReport` with `Insight[]` and plain-English `summary` string
- 18 unit tests across all column types and severity rules
- All four CI checks passing

### ✅ #15 — Chart transformations
- `buildCharts(quant, text)` exported from `src/lib/charts/index.ts`
- NPS → `nps_gauge`; rating → `bar` (sorted distribution); numeric → `histogram` (10 buckets); category → `pie` (top 10 + "Other"); open_text → `word_cloud_data` (normalized weights)
- `ChartSpec` union type: `NPSGaugeChart | BarChart | HistogramChart | PieChart | WordCloudDataChart`
- 13 unit tests covering all chart types, "Other" bucket collapsing, and min===max edge case
- All four CI checks passing

### ✅ #14 — Text analysis
- `analyzeText(dataset, mappings)` exported from `src/lib/text/index.ts`
- Analyses `open_text` columns only; skips all other types
- Word frequency: tokenizes to lowercase, strips punctuation, removes stop words and words < 3 chars; returns sorted `WordFrequency[]` with count and percentage
- `topWords`: top 20 by frequency
- Response length stats: mean, median, min, max character lengths
- Proxy sentiment: counts positive/negative/neutral responses based on word-list matching (no AI API); returns counts + percentages
- 17 unit tests covering column selection, word counting, stop word filtering, sentiment classification, multi-column datasets
- All four CI checks passing

### ✅ #13 — Quantitative analysis
- `analyzeQuantitative(dataset, mappings)` exported from `src/lib/analysis/index.ts`
- NPS: score, promoter/passive/detractor counts and percentages, mean
- Rating: mean, median, min, max, value distribution
- Numeric: mean, median, std deviation, min, max
- Category: frequency table sorted by count, unique count
- Skips empty values and non-numeric strings; skips id, ignore, open_text, date, unknown columns
- 17 unit tests covering all column types and edge cases
- All four CI checks passing

### ✅ #11 — Data cleaning pipeline
- `cleanDataset(dataset, mappings)` exported from `src/lib/clean/index.ts`
- NPS: non-integer / non-numeric → nullify; out of [0,10] → clamp
- Rating: non-integer or < 1 → nullify/clamp to 1
- Numeric: strips `$£€,` formatting; non-finite → nullify
- Date: parses and normalizes to `YYYY-MM-DD`; unparseable → nullify
- All types: leading/trailing whitespace trimmed
- `ignore` and `id` and `open_text` columns: trim only
- Returns `CleaningResult` with cleaned `Dataset` + `CleaningSummary` (per-column counts of trimmed/nullified/clamped/normalized; never logs cell values)
- `ColumnCleaningStats`, `CleaningSummary`, `CleaningResult` types added to `src/types/index.ts`
- 26 unit tests covering all column types, summary accuracy, and dataset integrity
- All four CI checks passing

### ✅ #10 — Schema validation
- `validateSchema(dataset, mappings)` exported from `src/lib/schema/index.ts`
- Checks for: no analysable columns (error), empty columns (error), low fill rate <50% (warning), NPS out of integer 0–10 range (warning), invalid rating/numeric/date values (warning)
- `ignore` and `id` columns are skipped entirely
- `SchemaIssueCode`, `SchemaIssue`, `SchemaValidationResult` types added to `src/types/index.ts`
- Messages include counts and percentages only — no cell values
- 22 unit tests across all column types, structural errors, and edge cases
- All four CI checks passing

### ✅ #9 — Column mapping screen
- `MappingSection` client component (`src/app/(app)/projects/[projectId]/mapping/MappingSection.tsx`)
- Reads `ParseResult` from `sessionStorage` via `useSyncExternalStore` (same pattern as `PreviewTable`)
- Runs `inferColumnTypes` via `useMemo` — no redundant re-inference on re-render
- Renders column name, 3 truncated sample values, inferred type with confidence badge (high/med/low), and editable type dropdown
- User overrides tracked in a `Map<string, ColumnType>` state — blue border highlights changed selects
- On "Next: Analyze": merges overrides with inferred mappings, saves `ColumnMapping[]` to `mapping:${projectId}` in `sessionStorage`, navigates to analysis page
- All four CI checks passing

### ✅ #8 — Column type inference
- `inferColumnTypes(dataset: Dataset): ColumnMapping[]` exported from `src/lib/infer/index.ts`
- Name-hint heuristics: nps, id, rating, date, open_text, category (underscore-separated column names handled)
- Value heuristics: NPS (integers 0–10 with zero present), rating (integers 1–10 low-cardinality), numeric, date (ISO + slash formats), category, open_text
- Name hint wins; value evidence used as confidence signal
- Samples ≤100 rows — never logs cell values
- 24 unit tests covering all ColumnType values + edge cases + confidence checks
- All four CI checks passing

### ✅ #7 — Data preview screen
- `UploadSection` parses the selected file via `parseCSV`, stores `ParseResult` in `sessionStorage`, navigates programmatically
- `PreviewTable` client component reads from `sessionStorage` via `useSyncExternalStore` (avoids hydration mismatch and React effect lint rules)
- Shows first 25 rows in a scrollable table with column headers
- Displays column count, row count, "Showing first 25 rows" badge when truncated
- Parse warnings rendered in an amber banner
- Empty state shown when no session data is present
- All four CI checks passing

### ✅ #6 — CSV parsing
- `parseCSV(text, filename)` — full RFC 4180 parser: BOM, CRLF/LF/CR, quoted fields with embedded commas and newlines, escaped quotes (`""`)
- Short rows filled with `""`, long rows truncated — both with count-only warnings (no cell values)
- `sanitizeFilename` applied to `originalFilename` before it leaves the module
- 27 unit tests across basic parsing, line endings, BOM, quoted fields, row-length mismatches, degenerate inputs, and privacy
- All four CI checks passing

### ✅ #2 — Landing page
- Hero with headline, subheadline, two CTAs, and constraint note (10 MB / 50k rows / no sign-up)
- "How it works" section: numbered 5-step workflow
- "Built for" grid: 4 target user cards with pain points
- Bottom CTA repeat and minimal footer
- Server component, no `"use client"`, all Tailwind v4, `next/link` only
- All four CI checks passing

### ✅ #5 — CSV validation
- `validateFileMetadata` — validates name, size, MIME type; no file read required
- `validateCSVContent` — strips BOM, checks headers, data rows, row count (≤50 k), column consistency
- `ValidationResult`, `ValidationIssue`, `ValidationCode` types added to `src/types/index.ts`
- 24 unit tests covering happy paths, edge cases (BOM, CRLF, quoted fields, boundary row counts), privacy (no cell values in messages)
- All four CI checks passing

### ✅ #4 — Upload page UI
- `DropZone` client component: drag-and-drop, click-to-browse, file validation (CSV type, 10 MB limit)
- Visual states: idle, drag-over, file-selected, error
- `UploadSection` client wrapper: holds selected file state, disables Next button until valid file chosen
- Upload page refactored to server component delegating to `UploadSection`
- All four CI checks passing

### ✅ #1 — Base project structure
- Resolved nested project directory
- Promoted `src/` layout to root
- Added `typecheck`, `test`, `test:watch` scripts
- Installed Vitest
- Created `src/types/index.ts`, `src/lib/data/index.ts`, `src/components/layout/PageHeader.tsx`
- Created all placeholder workflow pages
- All four CI checks passing
