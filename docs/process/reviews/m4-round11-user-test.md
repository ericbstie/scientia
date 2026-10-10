# M4 full blind user test, round 11

Run on 2026-10-10 by the user-tester thread with `.claude/skills/user-test/SKILL.md`,
against `main` at `f560b5e`, after a rebuild and a data reset. This is a full pass: seven
scenarios, run by fresh `user-tester` agents, one per scenario, each limited to
`scripts/look.ts`. The three read-only scenarios ran first, in parallel. The four scenarios
that write data ran one at a time, in this order: Maya's hand-in, Ingrid's announcement in
Modern European History, Ingrid's grade and release on a phone, the admin's enrolment fix.

The scenarios differ from round 9 and round 10 on purpose. The coordinator asked for
different starting pages, a phone-width teacher, a student looking for something that is
not there, and an admin fixing a mistake.

The demo data was reset before the pass. The write scenarios changed data: Maya's
Photosynthesis worksheet was handed in, HIS201 got an announcement, Sofia's Lab report 1 was
graded 78 of 100 and released, and Liam Hansen was removed from HIS201. Reset again before
any rerun.

## 1. Expectation interviews

Not run this round. The earlier interview notes are in the round 6 file.

## 2. Think-aloud scenario tests

| Scenario | Result | Commands |
| --- | --- | --- |
| Sofia, on a phone, starting from the calendar: find when the Field journal is due and how many points it is worth | Done | 3 |
| Liam: find the Week 3 lecture recording in Introduction to Biology, or say what to do if it is not there | Done | 10 |
| Ingrid, starting from the calendar: find when the essay in Modern European History is due and how many points it is worth | Done | 2 |
| Maya: start from the newest announcement, then hand in a typed answer for the Photosynthesis worksheet | Done | 5 |
| Ingrid: post an announcement in Modern European History and check where students see it | Done | 6 |
| Ingrid, on a phone: grade Sofia's Lab report 1 as 78 of 100 and release it | Done | 8 |
| Admin: remove Liam Hansen from Modern European History, and keep him in Introduction to Biology | Done | 7 |

Seven of seven Done, which is 100.0 per cent.

Premise checks against `supabase/seed.ts` and the reset data:

- Sofia: the Field journal is due Sat 31 Oct, 23:59, worth 100 points. True.
- Liam: no Week 3 recording exists. The seed has no recording. Week 3 is an unpublished
  module, so students do not see it. True by construction.
- Ingrid's essay: "Essay: the 1848 revolutions" is due Thu 15 Oct, 23:59, worth 100 points.
  True.
- Maya's hand-in: the Photosynthesis worksheet is not handed in. True.
- Ingrid's announcement: no conflicting announcement in Modern European History. True.
- Ingrid's grade: Sofia's Lab report 1 is submitted and needs grading ("2 need grading" in
  BIO101). True.
- Admin: Liam Hansen is enrolled in Modern European History and in Introduction to Biology.
  True.

The scenarios are new this round, so its results are not comparable with rounds 8 to 10
scenario by scenario.

## 3. Findings

| # | Finding | Testers | Change |
| --- | --- | --- | --- |
| 1 | Announcement notifications give the title only, so a student in two courses cannot tell which course one is from | 1 | #59 (ux) |

Noted, not filed. These are copy or design points for the designer, or a question that has
already been decided. Where a point came up in earlier rounds, the earlier decision stands.

- Submitting gives no confirmation or success message. The status changes to "Submitted", and
  the page offers "Edit submission" straight away with no note on whether editing is allowed.
  The same point was noted in rounds 8, 9 and 10 and not filed. A decision for the designer
  whether a hand-in needs a line of confirmation.
- "Submitted" appears twice in one section, once as the status and once as a label under
  "Your submission". Copy.
- "Notifications, 2 unread" gives no hint of what the unread items are. Copy.
- The compose form marks "Message" as "Optional", and Title has no "Required" marker. The
  announcement tester found this unclear this round, as did the round 10 tester. A decision for
  the designer on how required fields are shown.
- Each announcement row repeats "Pin", "Edit" and "Delete". The announcement page shows only
  the heading and the author. Design, under the minimal-UI rule.
- In the admin's roster, the Remove button in the list and the Remove button in the dialog
  share one word. Copy.
- The calendar shows a day for each due date, with no time and no points. It shows the course
  code only ("HIS201"), not its name. A calendar choice from round 7; the code-only entry is
  for the designer.
- "Showing October 2026" sits above the heading "October 2026". Copy; noted since round 10.
- On the essay's teacher page, "More time" has "Give more time" and the line "Everyone has the
  same due date." The dialog says "Only this student sees the new date", so the scope is clear
  once the dialog is open. A copy question for the designer on the page label.
- "Accepted, marked late" appears on the Field journal and essay pages. Per the coordinator's
  decision, #50 was closed as not planned, and this is not refiled.
- On a released grade, "Status: Released" and "Grade released" repeat on the same screen. One
  tester found "Withdraw" unclear, though the sentence beside it (#55) says that Withdraw hides
  the grade. Copy.
- The status word "Graded (not released)" and the filter "Graded, not released" differ in
  punctuation. Copy.
- The admin's Courses table shows course titles as plain text. The only link is "People in
  HIS201". The admin's first view is Users, not a dashboard, though the logo is labelled "go to
  dashboard". A design question.
- The dashboard's "Your courses" names BIO101 and then "Introduction to Biology", so the course
  is named twice. Copy.
- Dashboard rows run on with no separator in the text ("· in 2 days Submitted"). The status is
  a separate pill in the layout (checked in round 8). Not filed.
- Seed text, not the app: "Labs begin next week." in a welcome message dated 19 September.

Checked and not findings:

- Liam correctly does not see Week 3, because it is an unpublished module. Not a finding.
- The calendar shows no lecture times, because the seed has no lectures. Not a finding.
- Notifications went from 3 unread to 2 after an announcement was opened. That is the
  expected behaviour. Not a finding.
- Sofia's grade was released with one click and no confirmation dialog. #27's dialog covers the
  bulk release only, and the single release had none. Noted, not filed.

## 4. Retests from round 10

| Issue | Check | Result | Evidence |
| --- | --- | --- | --- |
| #58 | A late item that can still be handed in | Fixed | Noah's Lab report 1 keeps the status "Missing". The note above the open form reads "The due date has passed. You can still hand this in; it will be marked late." On Sofia's late Lab report 1, opening "Edit submission" (not saved) shows "The due date has passed. Submitting again will mark your work late." |
| #50 | Late-work line | Not retested | Closed as not planned by the coordinator, so not refiled |

Round 10's grade scenario was blocked by the permission system. This round's grade and release
(Sofia's Lab report 1) went through with no denial. The round 10 release was not re-run, as
the coordinator asked.

## 5. Method notes

- The read-only scenarios ran first, in parallel. The write scenarios ran one at a time, each
  after the previous one had finished.
- The Docker daemon was up at the start. The stack rebuilt from `f560b5e`.
- Each `look.ts` call starts at the dashboard, so a later call that assumed an earlier page
  printed the dashboard and did nothing. Three testers hit this. The admin tester's calls all
  landed on Users, not the dashboard.
- The admin tester had to repeat "Courses", then "People in HIS201", in every call, because the
  course title is not a link. Once "People in HIS201" alone failed for the same reason.
- The grading list's default filter is "Needs grading". A name taken from another filter (the
  "Graded, not released" one) was not visible in the default view, so the tester switched filter
  first. The tool did nothing, as designed.
- The admin tester's agent instructions described a first-time student visitor, while its task
  said to act as the administrator. It followed the task.
- `look.ts` refused to click a link while a dialog was open, which is the intended behaviour.
- The admin's removal confirmation was read before it was confirmed, in a new call.

## Next

- `ux.blind_tasks_done_pct` still reads the round 4 file. This round is seven of seven Done,
  100.0 per cent. The metric should point at a full pass, and this round is one. This run did
  not change it.
- Decisions for the designer: how required fields are shown (Title); whether a hand-in needs a
  line of confirmation (rounds 8 to 11); the "Give more time" label; the calendar's code-only
  entries; the admin course title that is not a link.
- Notifications: #59 names the missing course.

## 6. Designer's answers to the points left for the designer

Written by the designer thread after the round, with the change that carried them.

- **A hand-in needs a confirmation: changed.** The hand-in had a toast ("Submitted") that
  lasts 3.5 seconds at the top of the window, plus the status change. A tester reading the page
  after the click sees neither reliably, and the form it came from disappears. A hand-in is now
  confirmed in place: a success note "Your work is handed in." above the submitted work, which
  stays until the person leaves the page, and the line "You can edit it until your teacher
  starts grading." under the work. The toast for this one action is gone, so there is one
  confirmation, not two. `ui-guidelines.md` (Confirmations) records the exception.
- **Title has no "Required" marker: kept.** The rule is that a field is required unless its label
  says "Optional"; "Required" is never printed, because most fields would carry it. A required
  field left empty says what to enter ("Enter a title"). Every form follows the rule, so changing
  one form would make the others the odd ones. The guideline now gives this reason.
- **"Give more time": changed.** The button and its dialog are now "Give a student more time",
  which says whose date moves. The section is still "More time".
- **The calendar names a course by its code: kept, and made the rule.** Dashboard rows, the
  calendar and (since #59) notifications name a course by its code, the same short name as on the
  course cards. The full title is on the course's own pages. `ui-guidelines.md` (Dates, numbers
  and times) says so.
