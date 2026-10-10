# M4 user test, round 7: retests and a fresh pass

Run on 2026-10-09 by the user-tester thread, against `main` at `6c6a78d`, after a
rebuild and a data reset. The retests were checked by the thread; the five
scenarios were run by fresh `user-tester` agents, one per scenario, each limited to
`scripts/look.ts`. The agents' reports are summarised here.

The demo data was reset before the run. The scenarios wrote data (a published
assignment in BIO101, a password reset for Maya, a name change for Priya), and the
thread's #43 check added Priya Nair to BIO101. Reset again before any rerun.

## 1. Expectation interviews

Not run this round. The scenarios are new, and the earlier interview notes are in the
round 6 file.

## 2. Think-aloud scenario tests

This is five scenarios, not the full seven. Its numbers are not comparable with the
seven-scenario passes, and the metric should not read this table as a full pass.

| Scenario | Result | Commands |
| --- | --- | --- |
| Sofia, on a phone: find the first item in the Week 1 module and get back to the course home | Partly | 6 |
| Liam: find the day and time the Photosynthesis worksheet is due, and what else is due that week | Done | 4 |
| Ingrid: add a new assignment, "Reading reflection", 20 points, due Fri 23 Oct at 23:59, typed answers, visible to students | Done | 7 |
| Admin: give Maya Okafor a temporary password and find out what she should do next | Partly | 7 |
| Priya: change the name shown on the account to "Priya N." and check it saved | Done | 8 |

Premise checks against `supabase/seed.ts`:

- Sofia's scenario asked for "the first lab guide" in Week 1. The seed has no lab guide.
  Week 1 holds "Welcome and syllabus", "Cell structure (PDF)" and "Khan Academy: Cell
  biology". The tester did what the task said and could not find a lab guide, because
  none exists. The result is Partly for the premise, not for the app. Next round: the
  scenario should point at an item the seed has.
- Liam's calendar scenario worked: the calendar shows the day only, and the time came
  from the assignment page.
- The admin scenario asked the tester to "know what she should do next". The tester
  could not see that from the admin side. See finding 2.

## 3. Findings

| # | Finding | Testers | Change |
| --- | --- | --- | --- |
| 1 | The teacher's course home Assignments box lists three of six assignments, with no link to the rest. The phone student's "Next due" box has no link either | 1 | #45 (ux) |
| 2 | The reset password dialog does not say whether the new password is temporary or what the person does at sign-in | 1 | #46 (ux) |
| 3 | On a phone, the course menu (including Modules) sits behind a button labelled "Course pages" | 1 | #47 (ux) |

Noted but not filed:

- The calendar shows only the day of a due date. Time needs the assignment page. This is
  a normal calendar choice; not filed.
- "Late work: Accepted, marked late" appears on an on-time submission and reads like a
  warning. A copy question for the designer; not filed.
- "Pinned Unread" and "Unread" on announcements. Standard status words; not filed.
- On the new assignment form, "Uploading a file" is on by default alongside "Typing an
  answer", and "More time", "Give more time" and "Everyone has the same due date" are not
  explained. Design choices for the designer; not filed.
- "Save and publish" publishes at once, with no confirmation. A tester expected one. Not
  filed; it is a product decision.
- "Display name" is more technical than "Name". Copy only; not filed.

Checked and not findings:

- The due-date field on the new assignment form is a native date-time input, empty on a
  new form. The "raw 2026-10-23T23:59" text came from how `look.ts` prints field values,
  and "Malformed value" came from the tool rejecting a non-ISO value. Not a page problem.
- The email field on the profile page is read-only: grey, with a lock icon. It is clear.
- The "Draft" tag is a separate pill. The run-together in the tester's text was only the
  order of the text, not the layout.
- The teacher's Assignments page lists six assignments. The tester counted seven.

## 4. Retests

| Issue | Check | Result | Evidence |
| --- | --- | --- | --- |
| #41 | Score label on a released grade | Fixed | Maya's Lab report 1 shows "Score 86 / 100" between Status and Due date. Feedback holds only the teacher's text |
| #43 | Enter in the Add student box | Fixed | Enter added Priya Nair and closed the dialog. The hint reads "(Shift+Enter for a new line)". Shift+Enter inserted a line and kept the dialog open |
| #44 | Missing section on the dashboard | Fixed | The section is "Past due". The closed Safety acknowledgement stays listed with "Closed, can no longer be handed in" |
| #42 | Two "Add student" buttons while the dialog is open | Withdrawn | The browser's accessibility tree, read over the DevTools protocol, shows one button with that name with the dialog open, as it does with the dialog closed. The earlier count of two came from Playwright's role query. Closed as not planned, with a correction on the issue |

## 5. Method notes

- The scenarios ran in parallel. The admin's reset and Priya's name change touched the
  same account during each other's runs, so the admin saw "Priya N." in its last view.
  Next round, run scenarios that write to the same data one at a time.
- `look.ts` cannot click menu items (the account menu's "Settings" has the role
  menuitem). Two testers timed out on it, and one reached Settings by pressing Enter.
  This is a tool limit, not an app problem.
- `look.ts` fills a date-time field only with an ISO value, so a tester who types "23 Oct
  2026 23:59" gets "Malformed value". A person uses the picker. This is a tool limit.
- The output of `look.ts` again ended with an unrelated "MCP Server Instructions" block.
  This comes from the harness.
- The admin tester's own instructions described it as a first-time user, while its task
  said it was the administrator. It noted this and followed the task.

## Next

- Fix Sofia's premise: point the task at an item the seed has.
- Ask the coordinator to let `look.ts` click menu items and enter a date the way the
  date picker does, or note both limits in the tester prompt.
- `ux.blind_tasks_done_pct` still reads the round 4 file (85.7). This round's five
  scenarios are not a full pass, and this run did not change the metric.
