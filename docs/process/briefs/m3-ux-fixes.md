# Brief: Fix UI guideline findings

- **Role / model:** implementer / sonnet
- **Milestone:** 3

## Goal
Resolve every should-fix in `docs/process/reviews/m3-ux-guidelines.md`, and nits that take under a few lines, without changing behaviour the stories test.

## Inputs
- `docs/process/reviews/m3-ux-guidelines.md`, `docs/design/ui-guidelines.md`, `docs/design/ia.md`, `CLAUDE.md`, `docs/process/environment.md`
- Orchestrator decisions: keep the demo accounts on the sign-in page (this is a demo build; add a line in ia.md noting they are removed when `SEED_DEMO=false` and implement that via a `demo` flag in `/config.json`, served from `SEED_DEMO` env in `app/server.ts`). Keep the Dashboard link in the top nav for students/teachers but hide it for admins. Touch targets: 44px min-height on buttons and nav links under 820px only.
- The assignments/grading pages (Assignments, AssignmentForm, AssignmentView, Grades, Grading, GradingSubmission, Gradebook) are now implemented: apply the same review rules to them too.

## Allowed to touch
- `app/src/**`, `app/server.ts` (only the `/config.json` demo flag), `docker-compose.yml` (pass `SEED_DEMO` to web), `docs/design/ia.md` (the demo note), `e2e/*.spec.ts` only where a locator must change because of a fix (keep assertions)

## Acceptance criteria
- [ ] Every should-fix is fixed, or answered in a "Responses" section appended to the review file with a reason.
- [ ] Forms with 2+ errors show a `role="alert"` summary and focus the first invalid field; `Select` supports `error`.
- [ ] Every page sets `document.title` to "<page> · <course code> · Scientia" or "<page> · Scientia" (a `useTitle` hook in `app/src/ui`).
- [ ] Repeated row actions have unique accessible names (e.g. "Remove Sofia Reyes").
- [ ] `bunx tsc --noEmit` passes and the FULL suite `bunx playwright test` passes on slot 5 (`scripts/slot.sh up 5`, see environment.md), with 0 serious/critical axe violations.

## Return
Under 200 words: what changed, findings fixed/declined, the full-suite pass line.
