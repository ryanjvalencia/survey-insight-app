# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Schema validation module (`src/lib/schema/index.ts`) — `validateSchema(dataset, mappings)` checks for empty columns, low fill rate, and invalid values per column type (NPS 0–10, positive-integer rating, numeric, parseable date); returns `SchemaValidationResult` with per-column `SchemaIssue[]`; never logs or returns cell values (#10)
- Column mapping screen — `MappingSection` client component reads `ParseResult` from sessionStorage, infers column types via `inferColumnTypes`, and allows users to override each column's type via a dropdown; confidence badges (high/med/low) signal inference quality; saves final `ColumnMapping[]` to `mapping:${projectId}` in sessionStorage before advancing (#9)
- Column type inference module (`src/lib/infer/index.ts`) — `inferColumnTypes` infers NPS, rating, numeric, date, category, open_text, id, or unknown for each column using name heuristics and value sampling; returns `ColumnMapping[]` with confidence scores (#8)
- Data preview screen — upload step parses CSV in the browser, stores `ParseResult` in `sessionStorage`; preview page renders first 25 rows with column headers, row/column count, and parse warnings (#7)
- `PreviewTable` client component (`src/app/(app)/projects/[projectId]/preview/PreviewTable.tsx`) using `useSyncExternalStore` for hydration-safe sessionStorage reads (#7)

---

### Added (previous unreleased)
- Dashboard shell (`src/app/(app)/layout.tsx`) — persistent app nav wrapping all app routes via route group, landing page excluded (#3)
- `Nav` component (`src/components/layout/Nav.tsx`) — sticky top nav with active-state highlighting via `usePathname` (#3)
- `StepNav` component (`src/components/layout/StepNav.tsx`) — per-project workflow step strip with active step highlighting (#3)
- `docs/architecture.md` — route structure, component conventions, module layout

### Changed
- `dashboard/` and `projects/` moved into `(app)/` route group — URLs unchanged (#3)
- `[projectId]/layout.tsx` — removed redundant nav header, now delegates to `StepNav` (#3)
- `README.md` — replaced Next.js boilerplate with project-specific setup instructions

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
