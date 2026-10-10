# M4 full blind user test, round 8

Run on 2026-10-10 by the user-tester thread with `.claude/skills/user-test/SKILL.md`,
against `main` at `6fd573f`, after a rebuild and a data reset. This is a full pass:
seven scenarios, run by fresh `user-tester` agents, one per scenario, each limited to
`scripts/look.ts`. The read-only scenarios ran in parallel. The four scenarios that
write data ran one at a time, in this order: Maya's hand-in, Ingrid's announcement,
Ingrid's grade and release, the admin's teacher and course.

The demo data was reset before the run. The scenarios changed data: a hand-in for Maya
and a second for Sofia (checked by the thread), an announcement and link in BIO101, a
grade released for Liam (two grades, see below), a teacher and a course created. Reset
again before any rerun.

## 1. Expectation interviews

Not run this round. The earlier interview notes are in the round 6 file.

## 2. Think-aloud scenario tests

| Scenario | Result | Commands |
| --- | --- | --- |
| Sofia, on a phone: find what is due next, and when | Done | 11 |
| Maya: hand in a typed answer for the Photosynthesis worksheet | Done | 5 |
| Maya: read feedback on a released grade | Done | 6 |
| Noah: find missed work and check whether it can still go in | Done | 13 |
| Ingrid: post an announcement and add a link to a module | Done | 8 |
| Ingrid: grade and release one submission | Done | 10 |
| Admin: give a new teacher an account and a course | Done | 9 |

Seven of seven Done, which is 100.0 per cent.

Premise checks against `supabase/seed.ts` and the reset data:

- Sofia: upcoming work exists (Photosynthesis worksheet, Field journal). True.
- Maya's hand-in: the Photosynthesis worksheet is not handed in. True.
- Maya's feedback: Lab report 1 is released with a score (86). True.
- Noah's missed work: Lab report 1 is missing and Safety acknowledgement is closed. True.
- Ingrid's announcement: round 6 asked for "Lab report 1 feedback is ready", which the
  seed only partly supports. Round 8 asked for "Lab 2 starts Tuesday 13 October in the
  lab room" with a link to the Week 1 module. Lab 2 is the task's own information, so the
  premise is true by construction. Round 6 and round 8 results are not comparable.
- Ingrid's grade: Liam's Photosynthesis worksheet is handed in and needs grading. True.
- Admin: no Tara Quinn account and no ART110 course in the seed. True.

## 3. Findings

| # | Finding | Testers | Change |
| --- | --- | --- | --- |
| 1 | Relative due dates ("in 3 days", "13 days ago") do not match the calendar days beside them | 3 | #48 (bug) |
| 2 | Overdue work has different names on one page and across pages: "Missing", "Past due", "Late", "Submit late", "Submit" | 2 | #49 (ux) |
| 3 | "Late work: Accepted, marked late" appears on every assignment, including ones not yet due, with no cut-off or penalty | 4 | #50 (ux) |
| 4 | A released grade's page has no Withdraw button; Withdraw is only on the Released list | 1 | #51 (ux) |
| 5 | The New user dialog does not say whether the password stays or must be changed, unlike the reset dialog | 1 | #52 (ux) |

Noted, not filed:

- The grading run released two grades by mistake: Liam's Photosynthesis worksheet, which
  was intended, and his Lab report 1, which was not. The tester clicked the link
  "Liam Hansen", which matched the first of two rows. This is a tool problem, not an app
  problem (see method notes). Finding 4 is the app part.
- "Submit" gives a visible status of "Submitted" and changes the page to "Edit
  submission" with the time. A tester said there was no success message. The status is
  short, but it is there. Not filed.
- "Notifications: No notifications" with an unread announcement (a round 6 and round 8
  claim). The seed's announcements have no notification row. A new announcement from the
  app does appear in Notifications with "Unread", and the bell counts it. A seed artifact,
  not an app problem.
- The Lab report 1 submission says "Report text:" and "Sorry this is late". The
  Photosynthesis instructions point to "Modules, Week 2" without a link. Both are seed
  text.
- Several submissions show a time of exactly 23:59 or 00:22, which look like seed times,
  not upload times. Seed artifact.
- The calendar shows the day, not the time, of a due date. A normal calendar choice; not
  filed.
- "Shift+Enter for a new line" in the Add student dialog reads as clutter to an admin.
  Copy only.
- The admin's People page showed two buttons named "Add student" when the course had no
  students (the header button and one in the empty list). Not reproduced this round; the
  course had one student by then.
- "Draft" runs straight on after a date in the text. It is a separate pill in the layout
  (checked this round), so only the text order runs together. "Feedback Optional" was not
  checked visually.

## 4. Retests from round 7

| Issue | Check | Result | Evidence |
| --- | --- | --- | --- |
| #45 | Course home boxes link to the full lists | Fixed | The teacher's box is "Next due" with "All assignments" beside "New assignment". The announcements box has "All announcements". The student's "Next due" box links to "All assignments" |
| #46 | Reset password dialog says what happens | Fixed | "The new password works straight away and stays until it is changed under Settings. Nothing is sent: give it to Maya Okafor yourself." The New user dialog does not say the same (#52) |
| #47 | Phone course menu label | Fixed | The button reads "Course menu" |

## 5. Method notes

- The read-only scenarios ran in parallel. The writing scenarios ran one at a time.
- `look.ts` matched "Liam Hansen" to the first of two links that begin with the same
  name, and clicked it silently. A tester released the wrong grade through that match.
  A partial match on a link should fail when more than one link matches. Asked of the
  coordinator.
- The read-only check of Sofia's Notifications page ran before and after the new
  announcement, so the seeded announcement's missing notification is established.
- The grading tester's first output ended with an unrelated "MCP Server Instructions"
  block. This comes from the harness.
- The clock was 00:25 UTC on 10 October when the relative times were checked.

## Next

- `ux.blind_tasks_done_pct` still reads the round 4 file (85.7). This round is a full
  pass: seven of seven, 100.0. The metric should point at this file. This run did not
  change it.
- Ask the coordinator to make `look.ts` fail on an ambiguous link name.
- Put the premise checks into the scenario prompts, so a false premise is caught before
  the run.
