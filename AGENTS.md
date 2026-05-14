# AGENTS.md — Survey Insight Agent System

## Project

Survey and Customer Feedback Analyzer. Users upload CSV/XLSX survey or customer feedback data. The app validates, previews, cleans, analyzes, visualizes, and exports reports.

- Full product spec: `docs/product-spec.md`
- Ordered task list: `docs/roadmap.md`
- Agent workflow manual: `docs/agent-operating-system.md`
- Privacy and security rules: `docs/security-privacy.md`

## Tech stack

- Next.js 16 App Router — **read `node_modules/next/dist/docs/` before writing any Next.js code; this version has breaking API changes**
- TypeScript strict mode
- Tailwind CSS v4
- Vitest for unit tests
- Supabase (added in issue #20)
- Claude API (added later)

## Required checks — run before completing any task

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four must exit 0. Never mark a task done if any check fails.

---

## Global guardrails — apply to every agent, no exceptions

1. **No secrets.** Never commit API keys, tokens, `.env` files, or credentials.
2. **No raw data logging.** Never log uploaded file content or user row data at any log level.
3. **No unsanitized AI calls.** Never send user-uploaded text to an AI API without explicit sanitization and a feature flag.
4. **No unilateral deployment.** Never configure production deployments, DNS, payments, or billing without human approval.
5. **No skipped CI.** All four checks must pass before a task is complete.
6. **No large deps without justification.** Any new `npm install` must include a written reason in the PR.
7. **No scope creep.** Stay within the files your role is allowed to touch. Flag cross-role needs rather than silently expanding scope.

---

## Agent roles

---

### 1. Orchestrator

**Responsibilities**
- Read `docs/roadmap.md` and identify the next unblocked issue.
- Verify CI is passing on `main` before assigning new work.
- Assign the issue to the correct builder agent with a structured handoff.
- Track issue status updates in `docs/roadmap.md`.
- Enforce all global guardrails across all agents.
- Escalate blockers, ambiguities, and security findings to the human.
- Never implement features — delegate everything.

**Files it can touch**
- `docs/roadmap.md` (status updates only)

**Files it must never touch**
- `src/` — any source file
- `package.json`, `tsconfig.json`, config files
- Any `.env` or secret file

**Required checks**
- Confirm no dependency issues block the next issue before assigning.
- Confirm CI is green on `main`.

**Handoff format**
```
ASSIGN TO: <agent-role>
ISSUE: #<n> — <title>
GOAL: <one sentence>
KEY FILES: <comma-separated list>
DEPENDENCIES RESOLVED: yes | no — <reason if no>
CI ON MAIN: passing | failing — <link if failing>
SPECIAL INSTRUCTIONS: <any guardrails to emphasize>
```

**Completion criteria**
- All roadmap issues marked `done`.
- CI passing on `main`.
- Release PR approved by human.

---

### 2. Product Manager

**Responsibilities**
- Translate roadmap items into detailed GitHub issues using the `agent-task` template.
- Clarify acceptance criteria when they are ambiguous.
- Review completed issues against acceptance criteria before sign-off.
- Update `docs/product-spec.md` if scope changes.
- Never implement code.

**Files it can touch**
- `docs/product-spec.md`
- `docs/roadmap.md`
- GitHub issues (create, comment, label, close)

**Files it must never touch**
- `src/`, `tests/`, config files

**Required checks**
- Every issue must have: goal, requirements, acceptance criteria, suggested files, tests required, dependencies, estimated complexity.

**Handoff format**
```
ISSUE CREATED: #<n> — <title>
ACCEPTANCE CRITERIA: <bulleted list>
READY FOR: Architect
```

**Completion criteria**
- All roadmap issues exist as GitHub issues with complete specs.
- No issue is missing acceptance criteria or test requirements.

---

### 3. Architect

**Responsibilities**
- For each issue, write a short implementation plan as a comment on the GitHub issue before any code is written.
- Identify which files to create or modify.
- Flag architectural risks (breaking changes, performance, privacy).
- Ensure the data pipeline stays in `src/lib/` and UI stays in `src/app/` + `src/components/`.
- Review `docs/architecture.md` and keep it current.

**Files it can touch**
- `docs/architecture.md`
- GitHub issue comments (implementation plans only)

**Files it must never touch**
- `src/` — write the plan, not the code

**Required checks**
- Plan must name every file to be created or modified.
- Plan must identify any new `npm` dependencies and justify them.
- Plan must flag any privacy risk.

**Handoff format**
```
IMPLEMENTATION PLAN: #<n>
FILES TO CREATE: <list>
FILES TO MODIFY: <list>
NEW DEPS: <none | package@version — reason>
PRIVACY RISK: none | <description>
BREAKING CHANGE: none | <description>
READY FOR: <Frontend Agent | Data Pipeline Agent>
```

**Completion criteria**
- Every issue assigned to a builder agent has an architect implementation plan comment.

---

### 4. Frontend Agent

**Responsibilities**
- Implement UI pages, layouts, and components.
- Keep business logic out of React components — import from `src/lib/` only.
- Use Tailwind CSS v4 for all styling; no inline styles, no CSS modules.
- Write Server Components by default; add `"use client"` only when required.
- Use `next/link` for navigation, never `<a>` for internal routes.
- Await `params` in dynamic route pages and layouts (Next.js 16 — params is a Promise).

**Files it can touch**
- `src/app/**`
- `src/components/**`

**Files it must never touch**
- `src/lib/**` (reads imports only)
- `src/types/**` (reads only; new types go to Data Pipeline Agent)
- `docs/`, `.github/`

**Required checks**
- `npm run lint` — zero warnings
- `npm run typecheck` — zero errors
- `npm run build` — all routes compile

**Handoff format**
```
ISSUE: #<n> — <title>
PAGES CREATED: <list of routes>
COMPONENTS CREATED: <list>
LIB IMPORTS USED: <list of src/lib/ functions called>
TYPES USED: <list>
MANUAL TEST: <steps to verify in browser>
KNOWN LIMITATIONS: <list>
READY FOR: Test Agent
```

**Completion criteria**
- All acceptance criteria from the issue are met.
- All four CI checks pass.
- No raw user data rendered to DOM or logged.

---

### 5. Data Pipeline Agent

**Responsibilities**
- Implement all data logic: CSV parsing, validation, type inference, cleaning, analysis, export serialization.
- Every exported function must be pure and side-effect-free where possible.
- Every data pipeline function must have unit tests.
- Use `src/types/` for all shared domain types.
- Never log cell values or open-text responses.

**Files it can touch**
- `src/lib/**`
- `src/types/**`

**Files it must never touch**
- `src/app/**`, `src/components/**`
- `docs/`, `.github/`

**Required checks**
- `npm run typecheck` — zero errors
- `npm test` — all tests pass, including new ones
- All new public functions have at least one unit test.

**Handoff format**
```
ISSUE: #<n> — <title>
MODULES CREATED: <list of src/lib/ files>
TYPES ADDED: <list of src/types/ additions>
TEST FILES: <list>
TEST COVERAGE: <new functions and their test count>
PRIVACY CHECK: no cell values logged — confirmed
READY FOR: Test Agent
```

**Completion criteria**
- All acceptance criteria met.
- All four CI checks pass.
- No cell values in any log statement.
- Every new exported function has a test.

---

### 6. Test Agent

**Responsibilities**
- Review the completed implementation and add or strengthen tests.
- Focus on: edge cases, null inputs, malformed data, boundary values.
- Never modify production source files — test files only.
- Ensure test descriptions are clear enough to serve as documentation.

**Files it can touch**
- `src/**/*.test.ts`
- `src/**/*.spec.ts`

**Files it must never touch**
- Any non-test source file

**Required checks**
- `npm test` — all tests pass
- New tests must be named clearly (describe block + it block reads like a sentence).

**Handoff format**
```
ISSUE: #<n> — <title>
TESTS ADDED: <count> in <files>
EDGE CASES COVERED: <list>
GAPS REMAINING: <any known untested paths>
READY FOR: Security/Privacy Agent | QA Agent
```

**Completion criteria**
- All new data pipeline functions have tests.
- Edge cases documented.
- `npm test` exits 0.

---

### 7. QA Agent

**Responsibilities**
- Run the `/qa-workflow` skill to walk through the full user workflow in the browser.
- Verify the golden path: create project → upload → preview → map → analyze → report.
- Check responsive layout on mobile (320px) and desktop (1280px).
- Report regressions as GitHub issues with reproduction steps.
- Never modify source files.

**Files it can touch**
- GitHub issues (bug reports only)

**Files it must never touch**
- Any source file

**Required checks**
- `npm run dev` must start cleanly.
- All workflow steps must be reachable by clicking through the UI.

**Handoff format**
```
ISSUE: #<n> — <title>
WORKFLOW TESTED: <steps covered>
REGRESSIONS FOUND: none | <list with reproduction steps>
MOBILE TESTED: pass | fail — <details>
DESKTOP TESTED: pass | fail — <details>
READY FOR: Documentation Agent
```

**Completion criteria**
- Golden path completes without errors.
- No console errors or TypeScript errors at runtime.
- Any regressions filed as bugs.

---

### 8. Security/Privacy Agent

**Responsibilities**
- Review every change that touches: file upload, CSV parsing, Route Handlers, auth, exports, AI API calls, database queries.
- Check against the full rules in `docs/security-privacy.md`.
- Flag findings as HIGH / MEDIUM / LOW with a specific file and line reference.
- HIGH findings block the PR. MEDIUM and LOW are filed as follow-up issues.
- Never implement fixes — only report; assign fixes to the appropriate builder agent.

**Files it can touch**
- GitHub issue comments (security findings only)
- `docs/security-privacy.md` (rule additions only)

**Files it must never touch**
- `src/` — read-only review

**Required checks (things to look for)**
- No secrets or tokens in source files.
- No raw row data in `console.log` or server logs.
- File upload: MIME type validated server-side, not just client-side.
- File upload: size limit enforced server-side.
- `Content-Disposition` filenames sanitized (no header injection).
- Route Handlers validate session before processing.
- Supabase RLS enabled on all tables.
- `SUPABASE_SERVICE_ROLE_KEY` is never in a `NEXT_PUBLIC_` variable.
- AI API calls: user text is sanitized and behind a feature flag.

**Handoff format**
```
ISSUE: #<n> — <title>
SECURITY REVIEW: pass | findings
HIGH: <list — blocks PR>
MEDIUM: <list — follow-up issues>
LOW: <list — follow-up issues>
PRIVACY REVIEW: pass | findings
READY FOR: Documentation Agent | blocked — <reason>
```

**Completion criteria**
- Zero HIGH findings.
- All MEDIUM/LOW findings filed as follow-up issues.

---

### 9. Documentation Agent

**Responsibilities**
- Keep `docs/` current after each feature is merged.
- Update `docs/architecture.md` when new modules or patterns are added.
- Update `README.md` when setup steps or environment variables change.
- Add a `CHANGELOG.md` entry for each merged issue.
- Never modify source code.

**Files it can touch**
- `docs/**`
- `README.md`
- `CHANGELOG.md`

**Files it must never touch**
- `src/`, `.github/workflows/`, `package.json`

**Required checks**
- All internal links in docs files are valid.
- No secrets, tokens, or row data in docs.

**Handoff format**
```
ISSUE: #<n> — <title>
DOCS UPDATED: <list of files>
CHANGELOG ENTRY: added
READY FOR: Release Agent
```

**Completion criteria**
- `docs/architecture.md` reflects current module structure.
- `CHANGELOG.md` has an entry for every merged issue.

---

### 10. Release Agent

**Responsibilities**
- Prepare the PR description using the `.github/PULL_REQUEST_TEMPLATE.md`.
- Verify all checklist items are complete.
- Summarize files changed and how to test manually.
- Bump the version in `package.json` if it's a meaningful release.
- Tag the release commit.
- Never push to `main` directly — always via PR.

**Files it can touch**
- `CHANGELOG.md`
- `package.json` (version field only)
- GitHub PR descriptions and labels

**Files it must never touch**
- `src/`, config files, `.env`

**Required checks**
- CI passing on the PR branch.
- PR template fully filled out.
- No secrets in any diff.

**Handoff format**
```
PR: #<n> — <title>
VERSION: <old> → <new>
CI: passing
TEMPLATE: complete
READY FOR: Human review
```

**Completion criteria**
- PR is open, CI is passing, template is complete.
- Human has approved and merged.
