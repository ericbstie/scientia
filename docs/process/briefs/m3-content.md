# Brief: Course home, modules and pages, announcements, discussions, people

- **Role / model:** implementer / sonnet
- **Milestone:** 3
- **Issue:** #2

## Goal
Everything students read in a course and teachers publish, plus the roster.

## Inputs
- `CLAUDE.md`, `docs/process/environment.md`, `.claude/agents/implementer.md`
- `docs/stories/README.md` (personas, demo data, conventions) and the stories listed below
- `docs/design/ia.md` (your routes: regions, primary action, empty-state text) and `docs/design/ui-guidelines.md` (binding rules)
- `supabase/migrations/*.sql` (schema, RLS, notification triggers, submission guard) and `supabase/seed.ts` (exact demo data)
- `app/src/App.tsx` (routes are already registered; `useCourse()` gives `{ course, role }`, `useUnread()` the bell count), `app/src/ui/index.tsx`, `app/src/lib/*` (`db()`, `must()`, `useQuery`, `useAuth`, `fmtDateTime`, `studentStatus`, `lateBy`)
- `e2e/fixtures.ts` and `e2e/auth.spec.ts` (example spec). Fixture files: `e2e/files/sample.pdf`, `e2e/files/too-large.bin`.

## How to run
- Your isolated stack is slot 2: `scripts/slot.sh up 2` (rebuilds containers; the host dev server hot-reloads your edits), then `eval "$(scripts/slot.sh env 2)"; export PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome; bunx playwright test e2e/<your spec>`.
- Never use slot numbers other than 2, never run `docker compose down` on other projects, never run git.
- If you need a schema/RLS change, do NOT edit migrations: describe the exact SQL in your report and work around it if you can.

## Stories
US-5, US-6, US-7, US-15, US-20 (keyboard and screen reader basics across the app shell and course pages), US-23, US-24, US-25, US-26, US-34, US-35, US-36, US-37

## Allowed to touch
- `app/src/pages/course/{Home,Modules,PageNew,PageView,Announcements,AnnouncementForm,AnnouncementView,Discussions,ThreadNew,ThreadView,People}.tsx`, new files under `app/src/pages/course/content/`
- `e2e/content-*.spec.ts` (create)

## Acceptance criteria
- [ ] Every story listed has at least one test in your spec files whose title starts with `@US-<n>` and checks its acceptance criteria (UI text exactly as in the stories where they quote it).
- [ ] `bunx tsc --noEmit` passes with no errors.
- [ ] `bunx playwright test <your spec files>` passes on slot 2, twice in a row (tests are re-runnable; specs that change data call `reset()` in `beforeEach`).
- [ ] No serious/critical axe violations in `e2e/.results/a11y.jsonl` for your tests.
- [ ] Only files under "Allowed to touch" changed.

## Return
Under 200 words: files changed, stories covered, the pass summary line of your last two runs, any schema change you need, anything in the stories you could not meet and why.
