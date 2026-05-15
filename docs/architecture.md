# Architecture — Survey Insight

## Overview

Next.js 16 App Router, TypeScript strict mode, Tailwind CSS v4, Vitest.

---

## Route structure

```
src/app/
  layout.tsx                    Root layout — html, body, fonts, global CSS
  page.tsx                      Landing page (/) — no app shell
  (app)/
    layout.tsx                  App shell — persistent Nav, wraps all app routes
    dashboard/
      page.tsx                  /dashboard — project list
    projects/
      new/
        page.tsx                /projects/new — create project form
      [projectId]/
        layout.tsx              Per-project shell — StepNav strip
        upload/page.tsx         /projects/[id]/upload
        preview/page.tsx        /projects/[id]/preview
        mapping/page.tsx        /projects/[id]/mapping
        analysis/page.tsx       /projects/[id]/analysis
        report/page.tsx         /projects/[id]/report
```

**Route group `(app)`:** Groups app routes under a shared layout without adding a URL segment. The landing page `/` sits outside this group intentionally — it has no nav shell.

**Dynamic segments:** `[projectId]` matches any project identifier. `params` is a `Promise` in Next.js 16 — always `await params` before destructuring.

---

## Component structure

```
src/components/
  layout/
    Nav.tsx         Client component — top nav bar, active-state via usePathname
    StepNav.tsx     Client component — per-project workflow step strip, active-state
    PageHeader.tsx  Server component — page title, description, optional back link
```

**Client vs Server components:**
- Default to Server Components.
- Add `"use client"` only when browser APIs or React hooks are needed.
- `Nav` and `StepNav` are client components because they use `usePathname` for active highlighting.

---

## Data / library structure

```
src/lib/
  supabase/
    client.ts       Singleton Supabase browser/server client (anon key)
  db/
    projects.ts     CRUD for the projects table: createProject, getProject, listProjects, updateProjectStatus
    datasets.ts     Insert for the datasets table: saveDataset
  data/
    index.ts        Stub
  validate/         validateFileMetadata, validateCSVContent
  parse/            parseCSV — RFC 4180 parser
  infer/            inferColumnTypes
  schema/           validateSchema
  clean/            cleanDataset
  analysis/         analyzeQuantitative
  text/             analyzeText
  charts/           buildCharts
  insights/         generateInsights
  export/           serializeCSV
src/types/
  index.ts          Shared domain types: Project, Dataset, ColumnMapping, ColumnType, ParseResult, etc.
```

**Convention:** All business logic lives in `src/lib/`. React components import from `src/lib/` but never define data logic themselves.

---

## Persistence pattern (as of #20)

**Raw survey data:** browser sessionStorage only — never sent to the database.

**Metadata persisted to Supabase:**
- `projects` table — project name, status (`created` → `uploaded` → `analyzed`), timestamps
- `datasets` table — row count, column count, sanitized original filename; linked to project

**Status flow:** `createProject` (Server Action in `projects/new`) → `saveDataset` + `updateProjectStatus("uploaded")` (in `UploadSection`) → `updateProjectStatus("analyzed")` (in `MappingSection` after full pipeline).

**Server Actions:** `projects/new/page.tsx` defines an inline Server Action (`"use server"`) to create a project and redirect. No Route Handlers are used for persistence.

**RLS:** Both tables have RLS enabled. Policies are permissive (`using (true)`) until authentication is added in #21, at which point they will be replaced with `auth.uid() = user_id` row-scoped policies.

---

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Pages | lowercase segment matching URL | `upload/page.tsx` |
| Components | PascalCase | `StepNav.tsx` |
| Library modules | kebab-case | `parse-csv.ts` |
| Test files | collocated, `.test.ts` suffix | `parse-csv.test.ts` |
| Types | PascalCase interfaces | `ColumnMapping` |
| Enums / union types | camelCase string literals | `"open_text"` |

---

## Key constraints

- `src/app/` and `src/components/` — Frontend Agent only
- `src/lib/` and `src/types/` — Data Pipeline Agent only
- No secrets in source files
- No raw user data in logs
- `params` in dynamic routes is a Promise — must be awaited
