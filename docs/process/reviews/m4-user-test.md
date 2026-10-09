# M4 blind user test (first full pass)

Run on 2026-10-09 by the user-tester thread with `.claude/skills/user-test/SKILL.md`,
against `main` at `4428a6a`. The app code is unchanged since `edf8c3c` (the #25 fix).
Testers used `scripts/look.ts` only. The demo data was reset before the pass and again
afterwards.

The three teacher and student runs that touched the same course overlapped in time
(about 20:18 to 20:20), on one database. Maya's hand-in and Noah's missed-work check
ran at the same moment as the teacher runs. This is why the teacher's course home
briefly said "3 need grading" against a queue of 2. Checked alone afterwards, both show
2, so the mismatch is a concurrency artifact, not a bug.

## 1. Expectation interviews

Run for a student, a teacher and an administrator with no app access. The notes were
not kept in the thread, so this pass records no expectation highlights. Keep them next
time, as the M3 file did.

## 2. Think-aloud scenario tests

| Scenario | Result | Commands |
| --- | --- | --- |
| Sofia, on a phone: find what is due next | Done | 2 |
| Maya: hand in a typed answer for the Photosynthesis worksheet | Done | 3 |
| Maya: read feedback on a released grade | Done | 5 |
| Noah: find missed work and check whether it can still go in | Done | 12 |
| Ingrid: post an announcement and add a link to a module | Partly | 10 |
| Ingrid: grade and release one submission | Done | 12 |
| Admin: give a new teacher an account and a course | Done | 6 |

Six of seven Done, which is 85.7 per cent.

Premise checks against `supabase/seed.ts`:

- Ingrid's announcement task asked her to say that all lab report marks were released.
  In the seed, Liam's Lab report 1 grade is graded but not released, so the announcement
  said something that was not yet true. This is why the result is Partly. The tester did
  not check the premise before posting, and the app let the announcement go out.
- The grade-and-release task asked for a "Clear diagram" comment, but Liam's
  Photosynthesis answer is one sentence of text with no diagram. The comment does not
  fit the answer. The next run should use a comment that fits the seeded answer.
- Maya has a released Lab report 1 grade (86), so the read-feedback scenario had a real
  premise this time. Noah has missed work, as the seed says.

## 3. Findings

| # | Finding | Testers | Change |
| --- | --- | --- | --- |
| 1 | The grades table repeats one word in both columns: "Missing Missing", "Closed Missing", and "Not submitted" twice | 2 | #17, commented with the new cases |
| 2 | "Release all graded to students" releases every graded item in the course, not the one open. Its count went from 1 to 2 after one save | 1 | #27 |
| 3 | After Save, the grade leaves the default queue and nothing says the student cannot see it yet | 1 | #28 |
| 4 | Two queue rows for one student both link as "Liam Hansen" | 1 | #29 |
| 5 | Graded work handed in on time still says "Past due" on the assignment page | 1 | #30 |
| 6 | The unknown-email error told the admin to ask an administrator | 1 | #25, fixed. The retest checked the copy. The message has no link to the Users page; noted on #25 |
| 7 | Teacher's course menu says "Gradebook" and student's says "Grades" for the same area | 1 | Not filed. The two views differ by role |
| 8 | Course home "3 need grading" against a queue of 2 | 1 | Not reproduced. Concurrency artifact, see the note above |
| 9 | Dashboard link says "Submit late", the page button says "Submit" | 1 | Not filed. The page itself says "The due date has passed. Your work will be marked late." |
| 10 | Notification badge "1 unread" against items marked Unread | 1 | Not confirmed. The look tool does not print the badge count, so this was not checked |

## 4. Checks after the pass

These ran alone, after the blind runs, on the same build. They are not part of the
first-pass number.

| Check | Result | Notes |
| --- | --- | --- |
| Teacher gives one student extra time | Done | Ingrid gave Noah until Fri 16 Oct. The "More time" list shows Noah Berg with the new date and a Remove button |
| Not marked late before the new date | Done | Noah's dashboard lists Lab report 1 under Upcoming as "Not submitted", not under Missing |
| Submitting after the normal close | Done | A typed answer sent after 2 Oct shows "Submitted" with no late mark. The queue shows Needs grading, with no "Late by" text |
| "Due date changed" notification | Done | Noah's notifications show "Due date changed: Lab report 1", marked Unread. Sofia keeps the normal date and still shows "Late by 1 day" |
| Admin edits a course's code, title and teacher | Done | ART110 became ART120, "Art Foundations and Drawing", taught by Dr. Ingrid Solberg. The admin list updated, and Ingrid's dashboard lists ART120 with 0 students |
| Admin enters a duplicate code | Done | HIS201 changed to BIO101 shows "A course with this code already exists" on the field and saves nothing |
| The former teacher's dashboard updates | Not checked | There is no demo login for the former teacher |

## Next

- The first-pass table above is the round 4 number: 6 of 7 Done. `ux.blind_tasks_done_pct`
  on `main` still reads the M3 first pass (66.7) until the process coach points it here.
  This run did not change the metric.
- Fix the Ingrid premise: release Lab report 1 first, or ask for the announcement the
  teacher would write.
- Replace the "Clear diagram" comment in the grade scenario with one that fits a text
  answer.
- Keep the expectation interview notes in the review file.
