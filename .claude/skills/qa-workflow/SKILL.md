# Skill: /qa-workflow

Runs a structured QA walkthrough of the app's user workflow. Run this after the Test Agent completes and before the Security/Privacy Agent review.

## Usage

```
/qa-workflow
```

Or scoped to a specific workflow step:

```
/qa-workflow --step upload
/qa-workflow --step preview
/qa-workflow --step mapping
/qa-workflow --step analysis
/qa-workflow --step report
```

---

## What this skill does

1. Reads `docs/product-spec.md` (MVP workflow section) as the source of truth for expected behavior.
2. Starts `npm run dev` if not already running.
3. Walks through the user workflow step by step.
4. Checks each step against its acceptance criteria.
5. Verifies responsive layout at two breakpoints.
6. Reports any regressions, broken flows, or console errors.

---

## Pre-flight checks

Before testing, verify:

```bash
npm run build   # must exit 0
npm run dev     # must start without errors
```

If either fails, stop and escalate to the builder agent.

---

## Full workflow walkthrough

Work through each step in order. Mark PASS or FAIL with details.

### Step 0 — Home page (`/`)
- [ ] Page loads without errors
- [ ] "Get started" CTA is visible and links to `/dashboard`
- [ ] No console errors

### Step 1 — Dashboard (`/dashboard`)
- [ ] Page loads without errors
- [ ] "New project" button is visible and links to `/projects/new`
- [ ] Empty state is shown when no projects exist
- [ ] Project list renders correctly when projects exist (post-persistence issue)

### Step 2 — New project (`/projects/new`)
- [ ] Page loads without errors
- [ ] Form is visible
- [ ] Navigation to upload step works

### Step 3 — Upload (`/projects/[id]/upload`)
- [ ] Page loads without errors
- [ ] Drop zone or file input is visible
- [ ] Accepted file types are communicated to the user
- [ ] File size limit is communicated
- [ ] Invalid file type shows an inline error (does not submit)
- [ ] File over 10 MB shows an inline error (does not submit)
- [ ] Valid CSV triggers the upload flow
- [ ] "Next" navigation works

### Step 4 — Preview (`/projects/[id]/preview`)
- [ ] Page loads without errors
- [ ] Table renders with correct headers
- [ ] First 25 rows shown (not more)
- [ ] Row count displayed
- [ ] Parse warnings shown if present
- [ ] "Re-upload" link works
- [ ] "Next: Map columns" link works

### Step 5 — Column mapping (`/projects/[id]/mapping`)
- [ ] Page loads without errors
- [ ] Each column is shown with its inferred type
- [ ] User can change a column type via dropdown
- [ ] "Ignore" option is available
- [ ] Confirm button is disabled when all columns are set to ignore
- [ ] "Confirm and clean" navigates forward

### Step 6 — Analysis dashboard (`/projects/[id]/analysis`)
- [ ] Page loads without errors
- [ ] Charts render for each analyzed column
- [ ] No raw cell data visible in the DOM
- [ ] "Download cleaned CSV" button is present
- [ ] "Download PDF report" button is present

### Step 7 — Report (`/projects/[id]/report`)
- [ ] Page loads without errors
- [ ] Export buttons are present
- [ ] "Back to projects" link works

---

## Responsive checks

Test at two viewport widths:

| Check | 320px (mobile) | 1280px (desktop) |
|---|---|---|
| Home page readable | | |
| Dashboard table fits | | |
| Upload drop zone usable | | |
| Preview table scrollable | | |
| Column mapping table usable | | |
| Charts visible | | |
| Navigation accessible | | |

---

## Console error check

Open browser DevTools (F12) → Console tab. At the end of the full walkthrough:

- [ ] Zero errors
- [ ] Zero warnings about missing keys, prop types, or hydration mismatches

---

## Output format

```
QA WORKFLOW — Issue #<n>
Date: <date>

PRE-FLIGHT: pass | fail — <details>

STEPS TESTED:
- Step 0 (Home): PASS | FAIL — <details>
- Step 1 (Dashboard): PASS | FAIL
- Step 2 (New project): PASS | FAIL
- Step 3 (Upload): PASS | FAIL
- Step 4 (Preview): PASS | FAIL
- Step 5 (Mapping): PASS | FAIL
- Step 6 (Analysis): PASS | FAIL
- Step 7 (Report): PASS | FAIL

RESPONSIVE:
- Mobile (320px): PASS | FAIL — <details>
- Desktop (1280px): PASS | FAIL — <details>

CONSOLE ERRORS: none | <list>

REGRESSIONS FOUND: none | <list with reproduction steps>

VERDICT: PASS — ready for Security/Privacy Agent | FAIL — regressions filed as bugs
```

---

## What to do with regressions

1. File a GitHub issue using the `bug.yml` template.
2. Label it `bug` and `regression`.
3. Link it to the current PR.
4. Block the PR merge until critical and high-severity regressions are resolved.
5. Medium and low regressions may be merged with a follow-up issue filed.
