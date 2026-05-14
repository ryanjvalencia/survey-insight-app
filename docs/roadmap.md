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
| 9 | Column mapping screen | ⬜ not-started | #7, #8 | Frontend | Medium |
| 10 | Schema validation | ⬜ not-started | #6, #8, #9 | Data Pipeline | Small–Medium |
| 11 | Data cleaning pipeline | ⬜ not-started | #6, #10 | Data Pipeline | Large |
| 12 | Cleaning summary UI | ⬜ not-started | #11 | Frontend | Medium |
| 13 | Quantitative analysis | ⬜ not-started | #11 | Data Pipeline | Large |
| 14 | Text analysis | ⬜ not-started | #11 | Data Pipeline | Medium |
| 15 | Chart transformations | ⬜ not-started | #13, #14 | Data Pipeline | Medium |
| 16 | Analysis dashboard | ⬜ not-started | #15, #3 | Frontend | Large |
| 17 | Insight generation | ⬜ not-started | #13, #14 | Data Pipeline | Medium |
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
- #9 Column mapping screen (depends on #7 ✅, #8 ✅) — Frontend

**Recommended start order:** #9 (Frontend — both dependencies now done).

---

## Completed issues

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
