# Project Handoff — Survey Insight
**Date:** 2026-05-14
**Status:** Foundation complete, two roadmap issues done, no open bugs, CI green.

---

## What this project is

A web app that turns messy CSV survey/customer feedback exports into clean insights, charts, and downloadable reports. Target users: consultants, UX researchers, marketing agencies, startup founders.

Full spec: [docs/product-spec.md](product-spec.md)

---

## What has been built

### ✅ Issue #1 — Base project structure
- Single-root Next.js 16 App Router project under `src/`
- All four CI scripts wired: `lint`, `typecheck`, `test`, `build`
- Vitest installed and passing
- TypeScript strict mode
- Core domain types in `src/types/index.ts`: `Project`, `Dataset`, `ColumnType`, `ColumnMapping`, `ParseResult`
- Placeholder workflow pages for all routes (no data logic yet)
- `PageHeader` reusable component

### ✅ Issue #3 — Dashboard shell
- `(app)` route group layout — persistent top nav wraps all app routes, landing page excluded
- `Nav` component — sticky header with "Projects" active-state highlighting via `usePathname`
- `StepNav` component — per-project workflow step strip, highlights current step
- All app pages moved into `src/app/(app)/` (URLs unchanged)
- `docs/architecture.md` written
- `README.md` replaced with real project docs
- `CHANGELOG.md` created

### Agent operating system (complete)
The entire agent build infrastructure was created this session:
- `AGENTS.md` — 10 agent roles with responsibilities, file ownership, handoff formats
- `CLAUDE.md` — orchestrator instructions
- `docs/roadmap.md` — all 23 MVP issues with statuses and dependency graph
- `docs/agent-operating-system.md` — the 11-step build loop manual
- `docs/agent-prompts.md` — ready-to-run prompts for every agent role
- `docs/security-privacy.md` — hard rules with HARD BLOCK severity labels
- `.github/ISSUE_TEMPLATE/agent-task.yml` — structured issue form
- `.github/ISSUE_TEMPLATE/bug.yml` — bug report form
- `.github/PULL_REQUEST_TEMPLATE.md` — PR checklist
- `.github/workflows/ci.yml` — updated with job name + `.next/` guard
- `.claude/skills/implement-issue/SKILL.md` — `/implement-issue` skill
- `.claude/skills/review-pr/SKILL.md` — `/review-pr` skill
- `.claude/skills/qa-workflow/SKILL.md` — `/qa-workflow` skill

---

## Current file structure

```
src/
  app/
    layout.tsx                   Root layout — html, body, Geist fonts
    page.tsx                     Landing page (/) — outside app shell
    (app)/
      layout.tsx                 App shell — Nav + main slot
      dashboard/page.tsx         /dashboard — project list (empty state)
      projects/
        new/page.tsx             /projects/new — create project placeholder
        [projectId]/
          layout.tsx             Step layout — StepNav only
          upload/page.tsx        Step 1 placeholder
          preview/page.tsx       Step 2 placeholder
          mapping/page.tsx       Step 3 placeholder
          analysis/page.tsx      Step 4 placeholder
          report/page.tsx        Step 5 placeholder
  components/layout/
    Nav.tsx                      Client — top nav, active state
    StepNav.tsx                  Client — step strip, active step
    PageHeader.tsx               Server — page title + back link
  lib/
    data/index.ts                Stub — data modules go here
    smoke.test.ts                Vitest smoke test
  types/
    index.ts                     Domain types

docs/
  product-spec.md
  roadmap.md                     23 issues, #1 and #3 done
  architecture.md
  agent-operating-system.md
  agent-prompts.md
  security-privacy.md

.claude/skills/
  implement-issue/SKILL.md
  review-pr/SKILL.md
  qa-workflow/SKILL.md

.github/
  ISSUE_TEMPLATE/agent-task.yml
  ISSUE_TEMPLATE/bug.yml
  PULL_REQUEST_TEMPLATE.md
  workflows/ci.yml
```

---

## Git state — action required

**Nothing has been committed since the initial `Add CI checks` commit.**
All work from this session is untracked. Before starting the next session, commit everything:

```bash
git add .
git commit -m "feat: base structure, dashboard shell, and agent operating system

- Resolve nested project directory; promote src/ layout to root
- Add typecheck, test, test:watch scripts; install Vitest
- Add placeholder workflow pages for all routes
- Add (app) route group with persistent Nav and StepNav
- Add 10-agent operating system with prompts, skills, and docs
- Add GitHub issue templates and PR template
- Update CI workflow

Closes #1, #3"
```

---

## CI status

All four checks pass on the current working tree:
```
npm run lint      ✅
npm run typecheck ✅
npm test          ✅
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

## Known issues / deferred items

| Item | Severity | Notes |
|---|---|---|
| Empty `survey-insight-app/` ghost dir | Low | Windows file lock prevents `rm -rf`; invisible to Next.js and CI; delete manually by closing VS Code and running `Remove-Item -Recurse -Force survey-insight-app` in PowerShell |
| No React component tests | Low | `@testing-library/react` + jsdom not yet installed; flagged as follow-up when first stateful component logic needs coverage |
| `projects/new` does no real project creation | Expected | Hardcodes `/projects/demo/upload`; real creation requires Supabase (#20) |
| Export buttons on report page are disabled | Expected | Stubs for issues #18 and #19 |
| Nav shows project ID, not project name | Expected | Needs Supabase (#20) |

---

## Roadmap — what's next

From [docs/roadmap.md](roadmap.md):

| # | Title | Status | Unblocked? |
|---|---|---|---|
| 2 | Landing page | ⬜ | ✅ yes |
| 4 | Upload page UI | ⬜ | ✅ yes (#3 done) |
| 5 | CSV validation | ⬜ | ✅ yes |

**#4 and #5 are independent and can run in parallel.** #4 is Frontend, #5 is Data Pipeline.
#2 (Landing page) is small but lower leverage — the landing page already has a working placeholder.

**Highest leverage next move:** Start #5 (CSV validation) + #4 (Upload page UI) together.

---

## How to continue building

### Option A — Autonomous loop (one prompt)

Open a new Claude Code session and paste:

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

### Option B — Targeted single issue

```
/implement-issue #5
```

or

```
/implement-issue #4
```

### Option C — Role-by-role

See the individual agent prompts in [docs/agent-prompts.md](agent-prompts.md).

---

## Key decisions made this session

| Decision | Reason |
|---|---|
| Route group `(app)` instead of middleware-based layout | Cleaner separation — landing page gets no nav shell without special casing |
| `StepNav` extracted as a client component | `[projectId]/layout.tsx` is a server component (needs to `await params`); `usePathname` requires client context; the two concerns are split cleanly |
| Stale `.next/` cache must be cleared after file moves | Next.js 16 type-checks against `.next/types/validator.ts` which references file paths; moving files invalidates the cache |
| Agent system in docs/, not src/ | Agent infrastructure is pure documentation — no runtime cost, no build impact |
| No `@testing-library/react` yet | Would require human approval per guardrails; no stateful component logic exists yet that needs it |

---

## Contacts / repo

- Repo: `https://github.com/ryanjvalencia/survey-insight-app`
- Branch: `main`
- All work uncommitted (see Git state section above)
