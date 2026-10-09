# M4 blind user test after the redesign (round 6)

Run on 2026-10-09 by the user-tester thread with `.claude/skills/user-test/SKILL.md`.
The blind pass ran against `main` at `d2aee81`, the build that carries the
Designsystemet redesign. The retests ran after the stack was rebuilt from
`036bdcb` (the brand and metrics commit that followed). Testers used
`scripts/look.ts` for the steps a person would take. Checks that need the rendered
page (the upload control's click target, counts of buttons with one name, the dialog
text) were run with short Playwright scripts that read the page, not the code.

The demo data was reset before the blind pass and again before the retests. The
blind pass changed data (Maya's submission, Liam's grade, the BIO101 announcement,
the ART110 course), so later scenarios saw those changes. Reset before any rerun.

## 1. Expectation interviews

The student, teacher and administrator interviews ran before the blind pass. Their
notes were not saved to this file. The next run should keep them here, as the M3 file
did.

## 2. Think-aloud scenario tests

| Scenario | Result | Commands |
| --- | --- | --- |
| Sofia, on a phone: find what is due next | Done | 5 |
| Maya: hand in a typed answer for the Photosynthesis worksheet | Done | 6 |
| Maya: read feedback on a released grade | Done | 5 |
| Noah: find missed work and check whether it can still go in | Done | 14 |
| Ingrid: post an announcement and add a link to a module | Done | 8 |
| Ingrid: grade and release one submission | Done | 7 |
| Admin: give a new teacher an account and a course | Done | 12 |

Seven of seven Done, which is 100.0 per cent.

Premise changes against `supabase/seed.ts`. Results after a change are not directly
comparable with round 4:

- Ingrid's announcement. Round 4 asked her to say that all lab report marks were
  released. The seed has Liam's Lab report 1 graded but not released, so that
  sentence was false. Round 6 asked for "Lab report 1 feedback is ready". The round 4
  result (Partly) and this round's result (Done) are on different premises.
- The grade comment. Round 4 asked for "Clear diagram", but Liam's Photosynthesis
  answer is text. Round 6 used "Good start, add the Calvin cycle".
- The admin task creates a teacher (Tara Quinn), a course (ART110 "Art Foundations")
  and enrols Maya in it.

## 3. Findings

| # | Finding | Testers | Change |
| --- | --- | --- | --- |
| 1 | A released score sits as a bare "86 / 100" under the Feedback heading, with no label | 2 | #41 (ux) |
| 2 | The Missing section on the dashboard lists a closed item that can no longer be handed in, next to an open "Submit late" link | 1 | #44 (ux) |
| 3 | With the Add student dialog open, the page behind it still exposes a second "Add student" button; a click by name is ambiguous | 1 | #42 (bug) |
| 4 | Enter in the Add student box starts a new line, so one address needs a click | 1 | #43 (ux) |
| 5 | "Import users" beside "New user" looks unneeded | 1 | Not filed. For the designer's review |
| 6 | The Courses subtitle reads like a tutorial | 1 | Not filed. For the designer's review |
| 7 | The password dialog says "Give it to the person so they can sign in" and does not say whether the password must be changed at first sign-in | 1 | Not filed. Needs a check of the sign-in flow first |
| 8 | Teacher's course menu says "Gradebook" and the student's says "Grades" | 1 | Not filed. The two views differ by role |
| 9 | "Save" becomes "Save changes" after a grade is released | 1 | Not filed. Copy only |
| 10 | Three words for unsent work: "Missing", "Not submitted", "Closed" | 1 | Not filed. They mark three different states: not yet due, past due and still open, and closed |
| 11 | Notifications said "No notifications" while two announcements were Unread | 1 | Not reproduced. The bell showed "Notifications, 1 unread" with one item in the list |
| 12 | The announcement form has no link to where students read feedback | 1 | Not filed. A product question |
| 13 | The seed announcement "Lab report 1 marking update" says marking is "this week" | 1 | Seed copy, not the app |

Checked and not a finding:

- The Grades page labels the score ("Score" column) and the total ("Graded so far:
  96 of 110 points"). The label problem in #41 is only on the assignment page.
- The space before the comma in "Liam Hansen , Lab report 1" is in the accessible name
  only. The visible text is "Liam Hansen". Not filed.
- An earlier "no file input" reading on the Field journal page came from a check that ran
  before the upload form had rendered. The retest waited for the form and found it.

## 4. Retests

| Issue | Check | Result | Evidence |
| --- | --- | --- | --- |
| #16 | The file control on the essay (HIS201) and field journal (BIO101) upload forms | Fixed | The browser's "No file chosen" control is hidden. The control is a dashed zone with a "Choose file" button. At the centre of that button the topmost element is the file input, at 1280 and 390 px, so a click opens the picker. No horizontal overflow at 390 px |
| #28 | After Save, the page says the grade is saved but not released, and links to where it can be released | Fixed | "Saved, not released. Liam Hansen cannot see this grade until you release it, here or from Graded, not released." The link goes to the Graded filter, and a Release button is on the page |
| #29 | Two graded rows for one student name the assignment in the link | Fixed | The Graded view lists "Liam Hansen , Lab report 1" and "Liam Hansen , Photosynthesis worksheet". Each Release button names the assignment too |
| #27 | The bulk release asks first and names what it releases | Fixed | Clicking "Release all graded to students (2)" as the last step of a call opened "Release 2 grades?". It lists "Liam Hansen, Lab report 1" and "Liam Hansen, Photosynthesis worksheet", with Cancel and Release. Not confirmed. The button still covers the whole course on every filter; the dialog is what makes that safe |

Not retested this round: #31 is closed on the board and was not in the retest list.

## 5. Method notes

- The rule agreed on 21:25 is in the write-scenario prompts: when a step may open a
  confirmation, end the sequence on that step and inspect before confirming.
- The earlier round 5 finding on #27 was a testing artefact, because a chained step
  confirmed a dialog nobody saw. The dialog now prints mid-sequence.
- Output from `look.ts` sometimes ends with an unrelated "MCP Server Instructions"
  block. This comes from the harness, not the app.

## Next

- `ux.blind_tasks_done_pct` was set from the round 4 file (85.7). The first pass here
  is 100.0 on a changed premise, so compare with care. This run did not change the
  metric. The process coach should point it at this file.
- Keep the expectation interview notes in the review file.
- Put the premise checks into the scenario prompts, so a false premise is caught
  before the run.
