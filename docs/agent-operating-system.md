# Agent Operating System — Survey Insight

This document is the manual for the agent build system. It defines how agents receive work, what they must produce, how handoffs work, and what happens when things go wrong.

---

## Overview

The system runs as a sequential loop. Each iteration processes one GitHub issue from the roadmap. The loop only advances when the previous issue has passing CI and human (or orchestrator) sign-off.

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATION LOOP                          │
│                                                                 │
│  1. Read roadmap        →  pick next unblocked issue            │
│  2. Product Manager     →  verify/create GitHub issue spec      │
│  3. Architect           →  write implementation plan            │
│  4. Builder Agent       →  implement (Frontend or Data Pipeline)│
│  5. Test Agent          →  add/strengthen tests                 │
│  6. CI                  →  lint + typecheck + test + build      │
│  7. Security/Privacy    →  review if triggered (see rules)      │
│  8. QA Agent            →  walk through user workflow           │
│  9. Documentation Agent →  update docs and CHANGELOG            │
│ 10. Release Agent       →  open PR with completed template      │
│ 11. Human               →  review and merge                     │
│                                                                 │
│  → Update roadmap status to done → repeat                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1 — Orchestrator reads the roadmap

**Input:** `docs/roadmap.md`

**Task:**
1. Find all issues with status `done`.
2. Find all issues where every dependency is `done`.
3. From those, pick the highest-priority unblocked issue (lower number = higher priority).
4. Confirm CI is passing on `main` before proceeding.

**Output:** Structured handoff (see `AGENTS.md` → Orchestrator → Handoff format).

**Blocks if:**
- CI is failing on `main` → escalate to human.
- No issues are unblocked → escalate to human (dependency or spec problem).

---

## Step 2 — Product Manager verifies the issue spec

**Input:** Orchestrator handoff + GitHub issue number

**Task:**
1. Open the GitHub issue.
2. Confirm it was created using the `agent-task` template.
3. Verify every required field is filled: goal, requirements, acceptance criteria, suggested files, tests required, dependencies, complexity.
4. If any field is missing → fill it in and note the addition.
5. If the acceptance criteria are ambiguous → clarify them and update the issue.

**Output:**
```
ISSUE VERIFIED: #<n>
ACCEPTANCE CRITERIA CONFIRMED: <bulleted list>
CLARIFICATIONS MADE: none | <list>
READY FOR: Architect
```

**Skippable if:** The issue was previously verified and has not changed.

---

## Step 3 — Architect writes the implementation plan

**Input:** Verified GitHub issue

**Task:**
1. Read the acceptance criteria.
2. Read the suggested files from the issue.
3. Read the current state of any files that will be modified.
4. Write an implementation plan as a comment on the GitHub issue.

**Plan must include:**
- Every file to create (with full path from repo root)
- Every file to modify (with what changes)
- Any new npm dependencies (name, version, justification)
- Any privacy or security risk
- Any breaking change to existing types or API contracts

**Output:** GitHub issue comment in this format:
```
## Implementation plan

**Files to create:**
- `src/lib/parse/parse-csv.ts` — CSV parser returning Dataset
- `src/lib/parse/parse-csv.test.ts` — unit tests

**Files to modify:**
- `src/types/index.ts` — add ParseResult type

**New dependencies:** none

**Privacy risk:** none — parser does not log cell values

**Breaking changes:** none

**Assigned to:** Data Pipeline Agent
```

---

## Step 4 — Builder Agent implements

**Input:** Architect implementation plan + GitHub issue

**Who runs this step:**
- Issues touching `src/app/` or `src/components/` → **Frontend Agent**
- Issues touching `src/lib/` or `src/types/` → **Data Pipeline Agent**
- Issues touching both → **Both agents, coordinated by Orchestrator**

**Task:**
1. Read `AGENTS.md` fully before writing any code.
2. Read `node_modules/next/dist/docs/` for any Next.js-specific feature being used.
3. Read every file that will be modified before touching it.
4. Implement in small, committed increments.
5. Do not refactor unrelated code.
6. Do not add features not in the acceptance criteria.
7. Run all four CI checks before declaring done.

**Output:** Handoff in the format defined in `AGENTS.md` for the specific role.

---

## Step 5 — Test Agent adds tests

**Input:** Builder agent handoff + list of new/modified source files

**Task:**
1. Read every new source file.
2. Identify untested paths: edge cases, null inputs, boundary values, malformed data.
3. Add tests for those paths.
4. Confirm all tests pass.
5. Do NOT modify any non-test file.

**Test naming convention:**
```typescript
describe("parseCSV", () => {
  it("returns headers and rows for a valid comma-delimited file", () => {});
  it("strips BOM from the first header", () => {});
  it("returns a warning and truncates files over 50,000 rows", () => {});
  it("handles an empty file with a parse error", () => {});
});
```

**Output:**
```
TESTS ADDED: <count> across <files>
EDGE CASES COVERED: <list>
npm test: passing
READY FOR: Security/Privacy Agent
```

---

## Step 6 — CI must pass

This is not a person — it's an automated gate.

All four checks must exit 0:
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If any check fails, the loop **stops**. The builder agent fixes the failure before any further steps.

---

## Step 7 — Security/Privacy Agent reviews (conditional)

**Triggered when the issue touches any of:**
- File upload handling (`src/lib/upload/`, `src/app/api/upload/`)
- CSV parsing or data cleaning (`src/lib/parse/`, `src/lib/clean/`)
- Route Handlers that process user data
- Authentication or session management
- Database queries or Supabase config
- Data exports
- Any AI API call

**If not triggered:** Skip to Step 8.

**Task:**
1. Read every changed file in the diff.
2. Check against the full rules in `docs/security-privacy.md`.
3. Report findings at HIGH / MEDIUM / LOW severity.

**HIGH findings block the PR.** The builder agent must fix them before proceeding.

---

## Step 8 — QA Agent tests the workflow

**Input:** Dev server running (`npm run dev`)

**Task:**
1. Walk through the user workflow relevant to the completed issue.
2. For upload issues: upload a sample CSV, verify validation messages.
3. For preview issues: confirm the table renders correctly.
4. For analysis issues: confirm charts render and numbers are plausible.
5. Check mobile (320px wide) and desktop (1280px wide).
6. Report any console errors, broken links, or layout bugs.

**Output:**
```
WORKFLOW TESTED: <steps>
REGRESSIONS: none | <list with steps to reproduce>
MOBILE: pass | fail
DESKTOP: pass | fail
CONSOLE ERRORS: none | <list>
READY FOR: Documentation Agent
```

---

## Step 9 — Documentation Agent updates docs

**Input:** Builder handoff + QA pass

**Task:**
1. Update `docs/architecture.md` if new modules or patterns were introduced.
2. Update `README.md` if new env variables or setup steps are needed.
3. Add a `CHANGELOG.md` entry:

```markdown
## [Unreleased]

### Added
- CSV parsing module (`src/lib/parse/parse-csv.ts`) — handles comma, semicolon, BOM (#6)

### Fixed
- ...
```

**Output:**
```
DOCS UPDATED: <list>
CHANGELOG ENTRY: added
READY FOR: Release Agent
```

---

## Step 10 — Release Agent opens the PR

**Input:** All previous agent outputs

**Task:**
1. Create or update the PR for the current issue branch.
2. Fill out `.github/PULL_REQUEST_TEMPLATE.md` completely.
3. Verify CI is passing on the PR branch.
4. Add labels: the issue number, the agent role that implemented it.
5. Request human review.

**Output:**
```
PR OPENED: #<pr-number>
CI: passing
TEMPLATE: complete
READY FOR: Human review
```

---

## Step 11 — Human reviews and merges

The human is the final gate. They:
1. Read the PR description.
2. Spot-check the diff for anything surprising.
3. Verify the manual test steps work.
4. Approve and merge (or request changes).

After merge, the Orchestrator updates `docs/roadmap.md` and the loop repeats.

---

## Error handling

| Error | Who handles it | Action |
|---|---|---|
| CI failing on `main` | Orchestrator | Stop loop, escalate to human |
| A builder touches out-of-scope files | Orchestrator | Flag, revert if merged, file a fix issue |
| HIGH security finding | Security/Privacy Agent | Block PR, assign fix to builder |
| QA finds a regression | QA Agent | File a bug issue, block current PR |
| Missing tests for data pipeline | Test Agent | Add tests, re-run CI |
| Ambiguous acceptance criteria | Product Manager | Clarify on issue, update spec |
| New large dependency proposed | Orchestrator | Require justification before approving |

---

## What agents must never do

- Push directly to `main`
- Skip CI checks
- Commit secrets or `.env` files
- Log raw uploaded data
- Send unsanitized user data to an AI API
- Expand scope beyond their allowed files without orchestrator approval
- Mark a task done when CI is failing
- Create a production deployment without human approval
