# M4 full blind user test, round 10

Run on 2026-10-10 by the user-tester thread with `.claude/skills/user-test/SKILL.md`,
against `main` at `ef37d44`, after a rebuild and a data reset. This is a full pass:
seven scenarios, run by fresh `user-tester` agents, one per scenario, each limited to
`scripts/look.ts`. The three read-only scenarios ran first, in parallel. The four
scenarios that write data ran one at a time, in this order: Maya's hand-in, Ingrid's
announcement, Ingrid's grade and release, the admin's teacher and course.

The scenarios are the same as in round 9, so the results can be compared with round 9.

The demo data was reset twice: before the retests, and again before the blind pass. The
write scenarios changed data: Maya's Photosynthesis worksheet was handed in, BIO101 got an
announcement and a module link, Liam's Photosynthesis worksheet was graded 40 of 50 and
saved (not released), and Tara Quinn and ART110 were created with Maya enrolled. Reset
again before any rerun. The course id changes on each reset.

## 1. Expectation interviews

Not run this round. The earlier interview notes are in the round 6 file.

## 2. Think-aloud scenario tests

| Scenario | Result | Commands |
| --- | --- | --- |
| Sofia, on a phone: find what is due next, and when | Done | 10 |
| Maya: hand in a typed answer for the Photosynthesis worksheet | Done | 4 |
| Maya: read feedback on a released grade | Done | 6 |
| Noah: find missed work and check whether it can still go in | Done | 9 |
| Ingrid: post an announcement and add a link to a module | Done | 8 |
| Ingrid: grade and release one submission | Partly | 8 |
| Admin: give a new teacher an account and a course | Done | 10 |

Six of seven Done, which is 85.7 per cent. The Ingrid grade scenario is Partly for a reason
outside the app: the grade was saved (40 of 50, with the comment), and the release click was
denied by the permission system ("Permission for this action was denied by the Claude Code
auto mode classifier", reason "External System Writes"). The tester stopped there and did
not try another route, and nor did the thread. The release, and Liam's view of it, were not
observed. The release was not re-run: a denied action is not retried without the user's
decision. The scenario is blocked by the test harness (the permission system), not by the
app, and the metric is left as it is.

Premise checks against `supabase/seed.ts` and the reset data:

- Sofia: upcoming work exists (Photosynthesis worksheet, Field journal). True.
- Maya's hand-in: the Photosynthesis worksheet is not handed in. True.
- Maya's feedback: Lab report 1 is released with a score (86). True.
- Noah's missed work: Lab report 1 is missing and Safety acknowledgement is closed. True.
- Ingrid's announcement: "Lab 2 starts Tuesday 13 October in the lab room" is the task's own
  information, so it is true by construction. The Week 1 module is "Week 1: Cells".
- Ingrid's grade: Liam's Photosynthesis worksheet is handed in and needs grading. True.
  Liam's Lab report 1 is graded but not released in the seed. True.
- Admin: no Tara Quinn account and no ART110 course in the seed. True.

## 3. Findings

| # | Finding | Testers | Change |
| --- | --- | --- | --- |
| 1 | A late item that can still be handed in is marked Missing beside an open hand-in form, so it is unclear whether to hand it in | 1 (noted in round 9 too) | #58 (ux) |
| 2 | The late-work line still gives no cut-off and no penalty after the due date | 1 | #50 reopened (ux) |

Noted, not filed. These are copy or design points for the designer and the navigation
thread, or product questions. Where a point came up in earlier rounds, the earlier decision
stands.

- Submit gives no confirmation or success message. The status changes to "Submitted", the
  submission appears with its time, and the button changes to "Edit submission". Noted in
  rounds 8, 9 and 10 and not filed. The designer should decide whether a hand-in needs a line
  of confirmation.
- The Safety acknowledgement page says "Closed: this assignment stopped accepting work on
  Sat 26 Sept, 23:59. Ask your teacher if you need more time." Its "Your submission" section
  does not say whether the student handed anything in. One tester could not tell. Part of
  #44's design; for the designer.
- "Ask your teacher if you need more time" gives no way to reach the teacher (no link and no
  message). A product question.
- Submitted work stays under Upcoming with a countdown and the word "Submitted". One tester
  found that odd for finished work. A design question.
- "Grading" and "Gradebook" both sit in the teacher's course menu, and they read alike. For
  the navigation thread (`docs/design/navigation.md`).
- "Graded (not released)" on the page and "Graded, not released" in the filter differ. Copy.
- The save message for a grade is long and repeats the filter link: "Saved, not released ...
  Use Release below, or release it from Graded, not released." Copy.
- The Grades total reads "Total | 2 of 4 assignments graded so far | 96 / 110 | 87.3%". One
  tester found "so far" and the percentage unexplained. Copy.
- Upcoming rows say "50 points" and the pages say "Score 86 / 100". The same measure has two
  names. Copy.
- "Your answer" appears twice on the worksheet, as a label and as a heading. "How to hand in"
  reads "Type an answer" and "Upload a file or type an answer", while the buttons say "Submit".
  Copy.
- Each announcement row repeats "Pin", "Edit" and "Delete", and "Opens in a new tab" repeats
  under every link. Design. The minimal-UI rule applies.
- The announcement Title is not marked required, while Message is marked "Optional". A
  designer question on how required fields are shown.
- Assignment status runs on from the countdown in the text ("· in 60 days Draft", "Late by
  1 day Needs grading"). The pills are separate in the layout (checked in round 8), so only the
  text order runs together. Not filed.
- Deadlines show no time zone and dates show no year. Product copy.
- The admin tester's first call opened Users, not a dashboard, though the logo is labelled "go
  to dashboard". The admin has no home page of its own. A design question.
- "Teacher" appears as both a word and a role dropdown in the same Users cell. Design.
- "You can't deactivate your own account" is printed beside a disabled Deactivate button.
  Design.
- The Missing panel's empty text is a long sentence: "Work that is past its due date and can
  still be handed in appears here." Copy.
- Seed text, not the app: "Feedback: Thanks!" on the Safety acknowledgement; "Lab reports are
  being marked this week" beside a grade that is already released; "Released grades show up
  under Grades" in the announcement.
- "Release all graded to students (2)" does not say that it covers the whole course. #27
  added a dialog that names the items, so this is what the dialog is for. Not filed.
- "Nothing graded yet" above a Missing row and a Closed row, with empty score cells. The
  message is true of this student. Not a finding.

Checked and not findings:

- Lab report 1 is shown as "Late" in the status column and as "Submitted 1 day late" on its
  page. The page says it, so the status is clear enough. Not a finding.
- Lab report 1 is not on the Upcoming list. It is submitted, so it belongs in neither the
  Upcoming nor the Missing list.
- "Feedback Optional": the page holds "Feedback" and "Optional" as separate elements. Not a
  finding.

## 4. Retests from round 9

| Issue | Check | Result | Evidence |
| --- | --- | --- | --- |
| #44 | Dashboard Missing lists only work that can still be handed in | Fixed | Noah's dashboard: Missing lists Lab report 1 only. Sofia's dashboard: "Nothing missing". Sofia's Safety acknowledgement page: "Closed: ... Ask your teacher if you need more time." |
| #50 | Late-work line: cut-off and penalty | Reopened | The part about items not yet due is fixed. Noah's Lab report 1 after the due date still reads "Your work will be marked late." and gives no cut-off or penalty. See finding 2 |
| #53 | Grades total | Fixed | Maya's Grades table ends with "Total | 2 of 4 assignments graded so far | 96 / 110 | 87.3%" |
| #54 | "Attempt 1" removed | Fixed | Liam's submitted Photosynthesis worksheet (teacher view) reads "Submitted Fri 9 Oct, 02:01", with no attempt label. Maya's hand-in reads "Submitted Sat 10 Oct, 02:07", with no attempt label. The "Edited" tag needs a second hand-in, which was not tested |
| #55 | A grade's page says who can see it and that Withdraw hides it | Fixed | Ingrid's page for Maya's released Lab report 1: "Released. Maya Okafor can see this score and feedback. Changes you save show to the student at once; Withdraw hides the grade again." |
| #56 | The file control's name | Fixed | The browser's accessibility tree: the control is "File Choose file" before a pick, and "File sample.pdf Choose another file" after a local file is picked. Not submitted |
| #57 | Empty lists do not repeat the header button | Fixed | A new course with no students: the People page has one "Add student" button in the accessibility tree. Only the People page was checked |

The New course teacher hint was reworded too. It now reads "Only teachers are listed. If the
teacher is missing, create their account on the Users page first." The admin tester read it
as accurate.

## 5. Method notes

- The read-only scenarios ran first, in parallel. The write scenarios ran one at a time.
- The grading release was denied by the permission system's auto mode classifier. The tester
  stopped at the denial and did not try another route. The thread did not retry it either.
  The grade is saved and not released. The coordinator's relay (02:16 UTC) asked for the step
  to be re-run as a normal click. That relay does not change the permission decision, so the
  step was not re-run. Whether the release may run is for the user.
- The Docker daemon was down at the start, with stale PID files. Removing
  `/var/run/docker.pid` and the stale containerd PID file, then starting `dockerd` under
  `setsid nohup`, brought it back. The stack then rebuilt from `ef37d44`.
- Every `look.ts` call starts at the dashboard. Three testers lost a step to this. The
  prompts say each call starts fresh.
- `look.ts` `select` needs the exact option text ("Dr. Ingrid Solberg", not "Ingrid Solberg").
- `look.ts` refused an `in "<text>"` form on a course navigation link. The tester did not
  retry and had enough to answer.
- A grade filter's count changes after a save ("Graded, not released (1)" becomes "(2)"), so
  a label taken before the save fails the click. The tool did nothing, as designed.
- The harness again added an unrelated "MCP Server Instructions" block to a tester's output.
  It comes from the harness.
- The admin tester set the temporary password "Scientia-Tara-2026" for Tara Quinn in the demo
  data only. The reset removes it.

## Next

- `ux.blind_tasks_done_pct` still reads the round 4 file. This round is six of seven Done,
  85.7 per cent. The grade scenario is blocked by the test harness, not the app, so it is not
  a clean full pass. This run did not change the metric, and it is left as it is.
- Decision for the user: whether the grading release step may run. It was not re-run after
  the denial.
- Decision for the designer: the word for a late item with an open hand-in form (#58), and
  whether a hand-in needs a confirmation line (rounds 8 to 10).
- Decision for the product owner: what late work costs and up to what date (#50).
