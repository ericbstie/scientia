# M4 full blind user test, round 12

Run on 2026-10-10 by the user-tester thread with `.claude/skills/user-test/SKILL.md`,
against `main` at `10e9bb5`, after a rebuild and a data reset. This is a full pass: seven
scenarios, run by fresh `user-tester` agents, one per scenario, each limited to
`scripts/look.ts`. The three read-only scenarios ran first, in parallel. The four scenarios
that write data ran one at a time, in this order: Noah's late hand-in, Ingrid's announcement
in Introduction to Biology, Ingrid's grade and release on a phone, and the admin's role fix.

The scenarios vary their starting points, as the coordinator asked after rounds 8 and 9. The
read-only scenarios start from the notifications page, the grades page and the People page.

Retests from round 11 were checked before the pass (see section 4).

The demo data was reset before the pass. Setup: before the admin scenario, the thread set
Liam Hansen's account role to Teacher, so the admin had a mistake to fix. The write scenarios
also changed data: Noah's Lab report 1 was handed in late, BIO101 got an announcement, Liam's
Photosynthesis worksheet was graded 42 of 50 and released, and Liam's role was set back to
Student. Reset again before any rerun.

## 1. Expectation interviews

Not run this round. The earlier interview notes are in the round 6 file.

## 2. Think-aloud scenario tests

| Scenario | Result | Commands |
| --- | --- | --- |
| Noah, starting on notifications: find the newest notification, its course, and the work it is about | Done | 5 |
| Maya, starting on the grades page: find your total so far, what it counts, and how many points are still to come | Done | 4 |
| Ingrid, starting on the People page: count the students in Introduction to Biology and say whether Sofia Reyes is one | Done | 2 |
| Noah: hand in a typed answer for Lab report 1, which is past its due date, and check that it was handed in | Done | 6 |
| Ingrid: post the announcement "Lab 3 moves to Friday 17 October, same room." in Introduction to Biology | Done | 6 |
| Ingrid, on a phone: grade Liam Hansen's Photosynthesis worksheet 42 of 50 with a comment, and release it | Done | 8 |
| Admin: Liam Hansen's account was set to Teacher by mistake; set it back to Student and check he is still in Introduction to Biology | Done | 5 |

Seven of seven Done, which is 100.0 per cent.

Premise checks against `supabase/seed.ts` and the reset data:

- Noah's notifications: the newest is "Lab report 1 marking update" from BIO101 (Wed 7 Oct).
  True.
- Maya's total: 96 of 110 points from Safety acknowledgement and Lab report 1, with 150 points
  still to come. True.
- Ingrid's students: Maya, Liam, Sofia and Noah. True.
- Noah's Lab report 1: missing, with an open hand-in form. True.
- Ingrid's grade: Liam's Photosynthesis worksheet is submitted and needs grading. True.
- Admin: Liam's role was changed to Teacher by the setup step, and he is enrolled in
  Introduction to Biology as a student. True.
- **Scenario error, not an app finding.** The announcement text said "Friday 17 October". 17
  October 2026 is a Saturday: the site shows 10 October as "Sat". The tester posted the text as
  given, and the announcement is in BIO101 until the reset. The error was in the scenario
  prompt, and no issue is filed for it. Premise checks in later rounds will check weekdays
  against the site's own calendar.

## 3. Findings

No new finding passed the filing rule in this round. The filing rule is that a finding is
filed when a user is unsure what happened or what an action does, and when it is not a copy
or design question already decided.

Noted, not filed. These came up again or are copy or design points for the designer.

- "Missing" is read as contradictory beside "it will be marked late", and beside "Not submitted"
  on other items. Noah's notifications tester found it so this round, as did the round 9 and 10
  testers. The coordinator kept the word in #58, so this stands for the designer's record.
- The grades total reads "2 of 4 assignments graded so far", "96 / 110" and "87.3%". One
  tester (round 10 and this round) found the percentage could read as a course grade, and that
  "so far" is the only hint. Blank score cells for unsubmitted work give no points, and no
  points remaining are shown. A copy and product question for the designer.
- "Release all graded to students (1)" sits under the Grading heading and names no student. The
  #27 dialog names the items when clicked. Noted in round 10 too.
- Announcements do not link to the work they mention. The round 12 announcement "Lab reports
  are being marked this week" links to nothing, and the tester had to match it to Lab report 1
  by name. A design question.
- The dashboard lists no announcements; they appear only inside each course. Noted in rounds 11
  and 12. A design question.
- The grades caption "Your grades in Introduction to Biology" and the nav "BIO101 Introduction
  to Biology" name the course two ways on one screen. Copy.
- The announcement form has no "Required" marker on Title, and Message is marked "Optional". The
  coordinator decided on 2026-10-10 that fields are required unless marked Optional. Kept.
- After posting, no count of students notified is shown. Noted since round 9. A design question.
- The Remove button sits beside each student's name on the People page. A dialog appears on
  click (checked in round 11). Design.
- "Draft" appears as a bare word after the countdown on an unpublished assignment ("· in 60 days
  Draft"). Noted in several rounds, most recently this one. A designer question.
- The admin's role change saves at once, with no confirmation, no record of who made it, no undo,
  and no description of what each role can do. A product question.
- The admin's start page is Users, while the logo says "go to dashboard". Noted since round 10.
- "Max 4 pages" and "a labelled table" appear on a typed-answer assignment. Seed text.
- "Lab reports are being marked this week" appears beside a grade that is already released. Seed
  text.
- "Notifications, 2 unread" gives no hint of what the unread items are. Copy, noted in round 11.

Checked and not findings:

- The score field on a grade page is labelled "Score" and described by "out of 50" in the
  browser's accessibility tree. The tester called "out of 50" plain text, which is visual only.
  Not a finding.
- The notifications count goes down when an announcement is opened, and the poster gets no
  notification of their own post. Both expected.
- Links whose names carry live counts ("3 need grading") change after a save, so a route built
  before the save fails. That is by design, and the tests re-routed. A tool note.

## 4. Retests from round 11

| Issue | Check | Result | Evidence |
| --- | --- | --- | --- |
| #59 | Notifications name the course | Fixed | Liam's notifications: "New announcement: Reading list posted · HIS201 · Thu 8 Oct, 02:41", and "New announcement: Lab report 1 marking update · BIO101 · Wed 7 Oct". Noah's shows "BIO101" beside each time |
| Hand-in note | A hand-in shows "Your work is handed in." above the work, with "You can edit it until your teacher starts grading." | Fixed | Noah's late hand-in shows both lines, and "Edit submission" is still there. The tester did not report a toast. The toast was not checked separately |
| "Give a student more time" | The page button and dialog name a student | Not in this round's scenarios | Not tested |

## 5. Method notes

- The read-only scenarios ran first, in parallel. The write scenarios ran one at a time, each
  after the previous one had finished.
- The Docker daemon was down at the start, with stale PID files. Removing `/var/run/docker.pid`
  and the stale containerd PID file, then starting `dockerd` under `setsid nohup`, brought it
  back. The stack then rebuilt from `10e9bb5`.
- The setup step changed Liam's role to Teacher. The admin tester then set it back to Student.
  Both changes saved at once with no confirmation.
- Each `look.ts` call starts at the dashboard, so a later call that assumed an earlier page failed
  or printed the dashboard. Three testers this round hit this.
- The grade release went through with no denial. This is the second round in a row without a
  permission block on the release step. The round 10 release is still not re-run.
- The scenario error in section 2 (Friday, 17 October) came from the thread's prompt. The
  tester followed the text it was given.

## Next

- `ux.blind_tasks_done_pct` still reads the round 4 file. This round is seven of seven Done,
  100.0 per cent. The metric should point at a full pass, and this round is one. This run did
  not change it.
- Decisions for the designer: the word for an open late item ("Missing", #58, kept); the grades
  total and its percentage (copy and product); whether announcements link to the work they
  mention; the announcement count after posting; the "Draft" word after a countdown; the role
  change audit (product).
- Premise checks: check weekdays against the site's calendar before a scenario is run.
