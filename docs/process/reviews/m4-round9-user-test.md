# M4 full blind user test, round 9

Run on 2026-10-10 by the user-tester thread with `.claude/skills/user-test/SKILL.md`,
against `main` at `1306a65`, after a rebuild and a data reset. This is a full pass:
seven scenarios, run by fresh `user-tester` agents, one per scenario, each limited to
`scripts/look.ts`. The three read-only scenarios ran in parallel. The four scenarios that
write data ran one at a time, in this order: Maya's hand-in, Ingrid's announcement,
Ingrid's grade and release, the admin's teacher and course.

The scenarios are the same as in round 8, so the results can be compared with round 8.

The demo data was reset before the run. The write scenarios changed data: Maya's
Photosynthesis worksheet was handed in, BIO101 got an announcement and a module link,
Liam's Photosynthesis worksheet was graded 40 of 50 and released, Tara Quinn and ART110
were created with Maya enrolled, and an empty check course EMP999 was made to reproduce
#57. Reset again before any rerun.

## 1. Expectation interviews

Not run this round. The earlier interview notes are in the round 6 file.

## 2. Think-aloud scenario tests

| Scenario | Result | Commands |
| --- | --- | --- |
| Sofia, on a phone: find what is due next, and when | Done | 14 |
| Maya: hand in a typed answer for the Photosynthesis worksheet | Done | 4 |
| Maya: read feedback on a released grade | Done | 5 |
| Noah: find missed work and check whether it can still go in | Done | 9 |
| Ingrid: post an announcement and add a link to a module | Done | 9 |
| Ingrid: grade and release one submission | Done | 9 |
| Admin: give a new teacher an account and a course | Done | 9 |

Seven of seven Done, which is 100.0 per cent.

Premise checks against `supabase/seed.ts` and the reset data:

- Sofia: upcoming work exists (Photosynthesis worksheet, Field journal). True.
- Maya's hand-in: the Photosynthesis worksheet is not handed in. True.
- Maya's feedback: Lab report 1 is released with a score (86). True.
- Noah's missed work: Lab report 1 is missing and Safety acknowledgement is closed. True.
- Ingrid's announcement: "Lab 2 starts Tuesday 13 October in the lab room" is the task's
  own information, so it is true by construction. The Week 1 module exists ("Week 1: Cells").
- Ingrid's grade: Liam's Photosynthesis worksheet is handed in and needs grading. True.
- Admin: no Tara Quinn account and no ART110 course in the seed. True.

## 3. Findings

| # | Finding | Testers | Change |
| --- | --- | --- | --- |
| 1 | The Missing heading sits over the closed Safety acknowledgement, which can no longer be handed in | 2 | #44 reopened (ux) |
| 2 | "Graded so far: 96 of 110 points" can be read as one grade, and it includes Safety acknowledgement | 1 | #53 (ux) |
| 3 | "Attempt 1" on a submission has no explanation, on the student's page and the teacher's | 2 | #54 (ux) |
| 4 | "Withdraw" on a released grade does not say what it does or whether the student loses the grade | 1 | #55 (ux) |
| 5 | The file control's accessible name is "File", and the visible "Choose file" text is not in the accessibility tree | 1, confirmed with the accessibility tree | #56 (bug) |
| 6 | A course with no students shows two "Add student" buttons with the same name on its People page | 1, confirmed with the accessibility tree | #57 (ux) |

Filing rule used this round: a finding is filed when a user is unsure what happened or
what an action does. Wording that is only a matter of taste goes in "Noted, not filed".

Noted, not filed:

- Submitting gives no confirmation line. The status changes to "Submitted", the submission
  appears with the time, and the button changes to "Edit submission". The same was noted
  in round 8 and not filed. A tester said there was no success message.
- "Nothing graded yet. Grades appear here when your teacher releases them." sits above an
  "Awaiting grade" row on Sofia's Grades page. Checked: the message is true for her, since
  nothing is graded yet. Not a finding.
- Lab report 1 is not on Sofia's Upcoming or Missing lists. Checked: it is submitted, so it
  belongs on neither list. Not a finding.
- Lab report 1 shows "Submitted 1 day late" at "Sun 4 Oct, 23:59". The time is the seed's,
  not an upload time. Seed artifact.
- Notifications: the nav link is named "Notifications, 2", so a plain-name click on
  "Notifications" timed out in `look.ts`. The count is part of the name by design. A tool
  limit, see method notes.
- Grades and Modules are only in the phone "Course menu". This is #47's design. Checked.
- Ingrid's announcement: the sentence went in the Title box and the Message box is
  Optional. The announcement list shows only titles, so a long sentence becomes the
  headline. A question for the designer, not filed.
- "Module" and "page" are both used, and there are "Unpublish module" and "Publish module"
  buttons with a "Draft" tag. A question for the designer, not filed.
- "Your answer" appears twice on the worksheet page, as a label and as a heading. Copy.
- "Feedback Optional": the page holds "Feedback" and "Optional" as separate elements, so
  the run-together is only in the tester's text. Checked in the page text. Not a finding.
- Noah's Lab report 1 shows "Missing" next to "Your work will be marked late". This is the
  late-work design from #50, which accepts late work after the date. Not filed.
- Safety acknowledgement says "Closed: this assignment stopped accepting work on Sat
  26 Sept, 23:59" with no reason. Copy for the designer.
- "Saved, not released ... here or from Graded, not released." The tester could not tell
  what "here" pointed to. The Release button is on the page (round 6, #28). Copy for the
  designer.
- Teacher nav says "Gradebook" and the student nav says "Grades". Known from round 6. Not
  filed.
- Liam's "Next due" row shows "Graded" with no score. A design choice; the score is on the
  assignment page. Not filed.
- Admin copy: the Email field is labelled in the singular but takes several addresses on
  separate lines. The status lines differ ("added as a teacher", "created", "added").
  "Teacher Only accounts with the teacher role are listed." reads like an internal note.
  "Next to grade" does not say what it does. Copy for the designer.
- "changed under Settings" in the new-account help: it is written for the new teacher, who
  has a Settings page. The admin could not follow it from the admin menu, which is expected.
  Not a finding; the wording is the one round 8 #52 set.

## 4. Retests from round 8

| Issue | Check | Result | Evidence |
| --- | --- | --- | --- |
| #48 | Relative due dates match the calendar | Fixed | Noah's dashboard: "in 2 days", "7 days ago", "14 days ago", each matching its date |
| #49 | One vocabulary for overdue work | Fixed | The Missing and Closed tags, "Submit", and no "Past due" badge. The heading now says Missing over a closed item, which is #44 |
| #50 | The late-work line appears only after the due date | Fixed | Sofia's Photosynthesis worksheet, not yet due, has no late-work line. After the date, Noah's page says "Your work will be marked late" |
| #51 | Withdraw on a released grade's page | Fixed | Maya's released Lab report 1 (as Ingrid, before the write scenarios) and Liam's released Photosynthesis worksheet (after release) both show "Withdraw" beside "Save changes". Its wording is #55 |
| #52 | The New user dialog says what happens to the password | Fixed | Its hint now reads "It works straight away and stays until it is changed under Settings. Nothing is sent: give it to the person yourself." This matches the reset dialog (#46) |

#44 was closed in round 7 and is reopened in this round. The round 7 fix had renamed the
section "Past due", and #49 put "Missing" back on it. A closed item is listed under it
again. See finding 1.

## 5. Method notes

- The read-only scenarios ran in parallel. The write scenarios ran one at a time, each
  after the previous one had finished.
- Every `look.ts` call starts at the dashboard. The grading tester lost a step to this: a
  later call that assumed the earlier page was still open printed the dashboard and did
  nothing. The prompts say each call starts fresh, so a multi-step path is chained in one
  call.
- `look.ts` cannot click a link whose name carries a count ("Notifications, 2") by its
  plain name. The click timed out. Asked of the coordinator: a name that is a unique prefix
  should match.
- `look.ts` refused a click whose line did not match ("nothing on screen called
  'Assignments' can be clicked in a line with 'Course'"). The tester did not retry, and it
  had enough to answer. A tool limit, not an app problem.
- Checks for #56 and #57 were Playwright reads of the page: the page text, and the
  browser's accessibility tree read over the DevTools protocol. The #42 lesson applies:
  role counts from Playwright's role query are not enough on their own. No submit, save or
  release was clicked in these checks. The only write was creating EMP999 for #57, which
  the reset removes.
- The admin tester's own instructions described a first-time visitor who may use `goto`,
  while its task said to use the admin account and no `goto`. It followed the task, as in
  round 7.
- The output of `look.ts` again ended with an unrelated "MCP Server Instructions" block.
  This comes from the harness.

## Next

- `ux.blind_tasks_done_pct` still reads the round 4 file (85.7). This round is a full pass:
  seven of seven, 100.0. The metric should point at this file. This run did not change it.
- Decision for the designer and the tech senior: the word for the dashboard heading over
  overdue work and closed items (#44, #49).
- Ask the coordinator to let `look.ts` match a unique name prefix, so a link named with a
  count can be clicked.
- Copy items for the designer: the announcement Title and Message, "module" and "page",
  "here" in the save message, the admin's Email label and status lines, and "Next to grade".
