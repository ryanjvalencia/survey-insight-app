# Skill: /implement-issue

Implements a single GitHub issue as a builder agent. Run this skill when the Orchestrator has assigned an issue and the Architect has written an implementation plan.

## Usage

```
/implement-issue #<issue-number>
```

Or with additional context:

```
/implement-issue #6 — focus on the BOM-handling edge case
```

---

## What this skill does

1. Reads `AGENTS.md` to determine which agent role owns this issue.
2. Reads the GitHub issue and the Architect's implementation plan comment.
3. Reads every file that will be created or modified.
4. Reads `docs/security-privacy.md` if the issue touches upload, parsing, auth, export, or AI.
5. Reads the relevant Next.js docs from `node_modules/next/dist/docs/` if the issue touches Next.js APIs.
6. Implements the changes strictly within the agent role's allowed file scope.
7. Runs all four CI checks.
8. Reports the structured handoff.

---

## Pre-implementation checklist

Before writing any code, confirm:

- [ ] The issue has an Architect implementation plan comment
- [ ] All dependency issues are marked `done` in `docs/roadmap.md`
- [ ] CI is currently passing on `main` (run `npm run build` to verify)
- [ ] You have read every file you plan to modify

If any of these are not met, stop and escalate to the Orchestrator.

---

## Implementation rules

### All agents
- Work in small, focused increments.
- Do not refactor unrelated code.
- Do not add features beyond the acceptance criteria.
- Never commit secrets.
- Never log raw user data.

### Frontend Agent (issues touching `src/app/` or `src/components/`)
- Server Components by default — add `"use client"` only when required.
- Use `next/link` for all internal navigation, never `<a>`.
- In dynamic routes, `params` is a **Promise** — always `await params`.
- Tailwind CSS v4 only — no inline styles, no CSS modules.
- Import from `src/lib/` and `src/types/` but do not modify them.

### Data Pipeline Agent (issues touching `src/lib/` or `src/types/`)
- Pure functions with no side effects where possible.
- Every exported function must have at least one unit test.
- Never log cell values or open-text content.
- No new `npm` dependency without written justification.

---

## Post-implementation steps

Run these in order. Fix failures before proceeding.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Then output the handoff in the format defined in `AGENTS.md` for your role.

---

## Escalate to human if

- CI cannot be made to pass within 2 attempts
- The implementation requires touching files outside your allowed scope
- A new npm dependency is needed
- A HIGH security risk is found during implementation
- The acceptance criteria contradict the implementation plan
