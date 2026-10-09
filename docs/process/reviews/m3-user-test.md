# M3 blind user test

Run with `.claude/skills/user-test/SKILL.md` on 2026-10-09 against the demo data.

## 1. Expectation interviews (no tools, no product context)

Three agents were given only a role and a list of page names, then asked what they
expect on each page, what words they expect, and what would annoy them.

| Role | Expectations we already meet | Expectations we chose not to meet |
| --- | --- | --- |
| Student | Course cards plus what is due; course menu on the left (Home, Modules, Assignments, Announcements, Discussions, Grades, People); grades table with total and "missing"; dates with times; no teacher buttons for students | Personal calendar events, syllabus page, messaging (no story asks for them) |
| Teacher | "Needs grading" on course home; grading list with score, feedback, next student; gradebook grid with export; clear publish state; one place per task | Rubrics, weighted totals, sections, groups, email the class (no stories) |
| Admin | Users table with search, role filter, status; New user with role and password; Reset password; Deactivate with a confirmation that says data is kept | Last sign-in column, invitation email |

Things all three called annoying, used as a checklist: marketing or "how it was
built" text, tutorial banners, internal wording, duplicate labels for the same
state, unlabelled icons, dates without times, buttons that do not say what they do.

## 2. Think-aloud scenario tests (browser only, no code)

Six agents navigated the running app through `scripts/look.ts` and narrated what
they expected before every step.

| Scenario | Result | Commands |
| --- | --- | --- |
| Maya: find what is due next and hand in a typed answer | Done | 5 |
| Liam: read feedback, see standing, read latest announcement | Partly (Liam has no released grade in the demo data; the scenario premise was wrong) | 10 |
| Noah, on a phone: find missed work, check if it can still go in, ask in Discussions | Done | 11 |
| Ingrid: post an announcement, add a link to this week's module, set new work | Done | 9 |
| Ingrid: grade and release one submission, then find who is behind | Done | 8 |
| Admin: give a new teacher an account, create a course for him, enrol Maya | **Failed** | 8 |

No tester found competitor names, process words or "how it was built" text in the
interface. `copy.leaks` is 0.

## 3. Findings and what changed

| # | Finding (tester's words) | Change |
| --- | --- | --- |
| 1 | Admin: the New user "Role" field and the list's "Role" filter have the same label; the account was created as a student and there was no way to change it | Filter renamed "Show role"; each row has a "Role for <name>" control (not for your own account; enforced in `app/server.ts`); toast says "Tomas Lind added as a teacher"; US-39 gained a criterion and an e2e test |
| 2 | New course "Teacher" list silently omits non-teachers | Hint: "Only accounts with the teacher role are listed." |
| 3 | Password hint promised "they can change it later" (there is no such page) | "At least 8 characters. Give it to the person so they can sign in." |
| 4 | "Accepts: Text entry" is jargon | Student and teacher pages: "How to hand in: Type an answer / Upload a file"; form: "Students hand in by" with "Typing an answer", "Uploading a file" |
| 5 | Past-due work shows a Submit form but nothing says late work is allowed | New "Late work" fact on the student page: "Accepted, marked late" or "Not accepted after the due date"; form checkbox "Accept work after the due date (marked late)"; past-due submit form says "The due date has passed. Your work will be marked late." |
| 6 | The status badge reads as part of the assignment title (student) and the grading page title (teacher) | Moved out of the h1: a "Status" fact for students, a "Status:" subtitle on the grading page; bulk button reads "Release all graded to students (N)" |
| 7 | One grading state has three names ("Graded (not released)", gradebook "Draft", legend) and "Not graded" vs "Needs grading" | Gradebook now says "Not released", "Needs grading", "Late, needs grading"; legend says unreleased grades count in the teacher's total |
| 8 | "Save draft" suggests the grade is not saved | Button is "Save"; Release stays separate |
| 9 | Grades: "No released grades yet" above a table looks contradictory | "Total: none yet. Your total appears when your teacher releases a grade." |
| 10 | Course home did not surface the unread announcement | Course home lists up to three announcements, pinned first, with Pinned and Unread labels and an "All announcements" link |
| 11 | "Pinned Unread" ran together in one colour | Pinned is neutral, Unread is accent |
| 12 | A "Menu" button showed on desktop and its name said nothing | CSS bug fixed (it was meant for phones only); renamed "Course pages" |
| 13 | Dashboard "Missing" shows "Closed" with no explanation, and titles are not links | "Closed, can no longer be handed in"; titles link to the assignment |
| 14 | Announcement form does not say whether students are told | Hint: "Students in the course are notified when you post." |
| 15 | Worksheet instructions point at "five questions in the Week 2 overview" that are not there | Demo instructions rewritten to stand on their own |
| 16 | "You can't deactivate yourself" | "You can't deactivate your own account" |

## Kept on purpose

- **Demo accounts on the sign-in page.** One tester found them odd. They only appear
  when the stack runs with demo data (`SEED_DEMO`, on by default for `docker compose up`)
  so a first-time evaluator can sign in; set `SEED_DEMO=false` to hide them.
- **Native date picker.** The tester saw the raw `2026-10-16T23:59` value only because
  the text browser shows the field value; people see the browser's picker.
- **Module dates.** "Which week is this week" is a demo-data naming issue, not a missing feature.

## 4. Retest after the fixes (fresh testers, same rules)

| Scenario | Before | After |
| --- | --- | --- |
| Admin: new teacher, course, enrol Maya | Failed | Account (as teacher) and course done in 11 commands; enrolling Maya failed because only the course teacher can enrol students (US-18) and nothing said so. The Courses page now says "The teacher of each course adds its students, on the course's People page." Admin-side course management is gap 7 in `docs/research/gap-analysis.md` |
| Ingrid: grade, release, find who is behind | Done, 8 commands | Done, 9 commands; status in the title and the unexplained bulk release were the remaining complaints, both changed |
| Noah on a phone: missed work, can it still go in, latest news | Done, 11 commands | Done, 8 commands; asked for a warning before a late hand-in, added |

The two retests ran at the same time on one database, so the teacher saw Noah's new
late submission appear mid-test; the gradebook "inconsistencies" the teacher reported
came from that, not from the app.

## 5. Retest after admin course management (2026-10-09, `b09e093`)

| Scenario | Before | After |
| --- | --- | --- |
| Admin: new teacher, course, enrol a student | Failed | Done: account as teacher, course with that teacher, student added from the course's People page; the student sees the course and the teacher sees the student. One finding: the unknown-email error told the admin to ask an administrator (#25, fixed) |

A retest does not change `ux.blind_tasks_done_pct`; the next full first pass does.
The feedback scenario must use Maya, the only student with a released grade.
