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
| 2 | Landing page | ⬜ not-started | #1 | Frontend | Small |
| 3 | Dashboard shell | ✅ done | #1 | Frontend | Small |
| 4 | Upload page UI | ⬜ not-started | #3 | Frontend | Medium |
| 5 | CSV validation | ⬜ not-started | #1 | Data Pipeline | Small–Medium |
| 6 | CSV parsing | ⬜ not-started | #5 | Data Pipeline | Medium |
| 7 | Data preview screen | ⬜ not-started | #6 | Frontend | Medium |
| 8 | Column type inference | ⬜ not-started | #6 | Data Pipeline | Medium |
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
- #2 Landing page (depends on #1 ✅)
- #4 Upload page UI (depends on #3 ✅)
- #5 CSV validation (depends on #1 ✅)

**Recommended start order:** #4 + #5 in parallel — #4 builds the upload UI, #5 starts the data pipeline. Both are independent of each other.

---

## Completed issues

### ✅ #1 — Base project structure
- Resolved nested project directory
- Promoted `src/` layout to root
- Added `typecheck`, `test`, `test:watch` scripts
- Installed Vitest
- Created `src/types/index.ts`, `src/lib/data/index.ts`, `src/components/layout/PageHeader.tsx`
- Created all placeholder workflow pages
- All four CI checks passing
