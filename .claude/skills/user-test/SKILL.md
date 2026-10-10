---
name: user-test
description: Run blind user tests of the Scientia interface with fresh agents that never see the code or our intentions, to find copy that leaks internal context and flows that surprise real users. Use after any change to pages or interface copy, and before closing a milestone.
---
# Blind user tests

The testers must know only what a real user would know. Never tell them what
the product is meant to be, who it competes with, or what we think is good.

## 1. Expectation interviews (no app access)
Spawn 2–3 haiku agents with **no tools**. Prompt each only with a role and a
list of page names, e.g.:

> You are a university student. Your school gave you an account on a website
> called Scientia. For each page below, say in 2–3 lines what you expect to find
> there, what you would look for first, and what words you would expect on the
> buttons: Dashboard, Calendar, Notifications, Settings, a course's Home,
> Modules, Assignments, one assignment, Announcements, Discussions, Grades, People.

Do the same for a teacher (add Grading, Gradebook) and an administrator (Users, Courses).

## 2. Think-aloud task tests (app only, no code)
Spawn one haiku agent per scenario. Allowed tool: Bash, and only to run
`bun run scripts/look.ts` (see its header for steps; it prints what is on screen).
They must not read, list or search any files. Prompt:

> You are <role> using a website for your courses. Task: <task in plain words>.
> You can only see the site through this command: <look.ts usage>. Before every
> action, write what you expect to happen and why. After it, write what you saw
> and whether it matched. Finish with: (1) did you complete the task, (2) every
> moment you were unsure or surprised, (3) any words on screen that seemed
> unnecessary, odd, or not meant for you, (4) words you expected but did not find.

Scenarios to cover each time: student finds what is due and hands in work;
student reads feedback and grades (as Maya, the only demo student with a released grade); student who has missed work; teacher posts an
announcement and adds material (if the announcement says marks are out, the task
releases Lab report 1 first: Liam's grade is not released in the seed); teacher
grades and releases (the comment must fit the work: Liam's Photosynthesis
worksheet is a one-sentence typed answer); admin creates an
account and a course; one scenario with `--phone`.

## 3. Act on it
- Merge findings into `docs/process/reviews/<milestone>-user-test.md`: finding,
  how many testers hit it, the change made (or why not).
- Record the first pass in a table headed `| Scenario | Result | Commands |`,
  Result starting with `Done`, `Partly` or `Failed`. `mise run metrics` reads it
  as `ux.blind_tasks_done_pct`; retests after fixes go in a separate table with
  other headers and do not change the number.
- State the blind-tasks number only by quoting the line `mise run metrics` prints
  ("ux.blind_tasks_done_pct is read from …") on current main. Never carry it over
  from an earlier round file: rounds 7 to 12 repeated a stale "round 4 (85.7)".
- Check each scenario's premise against `supabase/seed.ts` before running it
  (M3: Liam's "read feedback" scenario had no released grade to read).
- Fix copy and flows, keeping e2e assertions in step (update stories if a quoted
  string changes).
- Run `bun run supabase/reset.ts` afterwards; testers change data.
