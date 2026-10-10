# User stories for Milestone 3

These 46 stories are the product's committed scope: 43 from Milestone 3 (M3), then US-44 to US-46. Each one is written so a Playwright test can check it in a browser against the seeded demo data below. Product reasoning is in `docs/research/synthesis.md`. The demo data is produced by `supabase/seed.ts`, which is the source of truth: this file describes it and must match it.

Files: `student.md` (US-1 to US-21), `teacher.md` (US-22 to US-37, US-45), `admin.md` (US-38 to US-44, US-46).

Priorities: P0 must ship in M3, P1 should ship in M3. Anything P2 or later lives in the "Later" list of the synthesis and has no story id.

## Personas

| Persona | Role | Who they are |
|---|---|---|
| Maya Okafor | student | A diligent first-year taking Biology and History. She checks the dashboard daily and wants to know what is due next. |
| Liam Hansen | student | A second student in both courses who submits at the last minute and asks questions in the discussion. |
| Sofia Reyes | student | Takes Biology only. She hands work in late and is the late-submission case. |
| Noah Berg | student | Takes Biology only. He has missed work and is the "missing" case. |
| Priya Nair | student | A registered student who is not yet in any course. She is the person a teacher adds by email and the account an admin deactivates. |
| Dr. Ingrid Solberg | teacher | Teaches both courses. She wants to publish material, collect work and release grades with as few clicks as possible. |
| Alex Admin | admin | Runs the school's Scientia setup. Creates courses and user accounts and resolves access problems. |

## How tests use the demo data

- **Reseed.** Every spec that changes data calls `reset()` from `e2e/fixtures.ts` in `beforeEach`. It runs `bun run supabase/reset.ts`, which restores exactly the data below. Specs that only read data may skip it. Sign in with `signIn(page, who)` from the same file. The fixture also runs an axe scan on the last page of every test (see US-20).
- **Time.** The seed uses the real clock. "T" is the moment `reset()` ran; a test records `Date.now()` just before calling it and computes every expected date from that. The browser runs in UTC with locale en-GB, so no time-zone conversion is needed. Criteria never name calendar dates or months:
  - "due in N days" or "T+Nd" means 23:59 UTC on the UTC date that is N days after the date of T. Negative N is in the past.
  - "N days ago" means exactly N times 24 hours before T.
  - Due dates and submission times display as `ddd D MMM, HH:mm` (en-GB, for example the weekday abbreviation, day, month abbreviation, then 24-hour time). Dates without a time (announcements, calendar cells) display as `ddd D MMM`.
  - "Now" in a criterion (a time created during the test) means the current UTC time to the minute, plus or minus one minute.
  - Calendar tests move between months with the "Next" and "Previous" buttons until the cell for a computed date is visible; they never name a month.
- **Direct URLs.** Stories do not fix URL paths (routes are in `docs/design/ia.md`). When a criterion says "opens the URL", the test first reaches the page through the interface as a user who may see it, records `page.url()`, then visits that URL as the other user.
- **Data API checks.** "Request `/rest/v1/<table>`" means a request from the test with the signed-in user's access token (from `POST /auth/v1/token?grant_type=password`) and the anon key from `/config.json`, sent to the app origin. Ids are looked up through the same API.
- **Downloads.** Downloads (including the gradebook CSV, which is built in the browser) are checked with Playwright's `download` event, never a URL.
- **Fixture files** are `e2e/files/sample.pdf` (592 bytes) and `e2e/files/too-large.bin` (11 MB). The upload limit is 10 MB per file.
- **Texts in quotes are exact.** Where a criterion quotes an error, label or heading, that string is the product text and the test matches it exactly.

## Demo data

All stories assume this seed and nothing else. Every account has the password `Demo-pass-123`. Every assignment is due at 23:59 on its day.

### Accounts

| Name | Email | Role | Status |
|---|---|---|---|
| Alex Admin | admin@scientia.test | admin | Active |
| Dr. Ingrid Solberg | ingrid.solberg@scientia.test | teacher | Active |
| Maya Okafor | maya.okafor@scientia.test | student | Active |
| Liam Hansen | liam.hansen@scientia.test | student | Active |
| Sofia Reyes | sofia.reyes@scientia.test | student | Active |
| Noah Berg | noah.berg@scientia.test | student | Active |
| Priya Nair | priya.nair@scientia.test | student | Active |

### Courses and enrolment

- **BIO101 Introduction to Biology** (Autumn 2026): "Cells, energy and inheritance: the foundations of modern biology." Teacher Ingrid; students Maya, Liam, Sofia, Noah.
- **HIS201 Modern European History** (Autumn 2026): "Revolutions, nations and empires in Europe from 1789 to 1918." Teacher Ingrid; students Maya, Liam.
- Priya has no enrolments.

### Course material

BIO101:
- "Week 1: Cells" (published):
  - page "Welcome and syllabus", body: `Welcome to BIO101!`, then `Each week has a short reading, a lab and one assignment. Hand in work on Scientia before 23:59 on the due date.`, then `Office hours: Tuesdays 14:00–15:00, room B2.14.` (three paragraphs);
  - file "Cell structure (PDF)", file name `cell-structure.pdf` (a one-page PDF stored by the seed);
  - link "Khan Academy: Cell biology", URL `https://www.khanacademy.org/science/biology/structure-of-a-cell`.
- "Week 2: Photosynthesis" (published):
  - page "Photosynthesis overview", body: `Photosynthesis turns light energy into chemical energy.` then `Light reactions happen in the thylakoid membranes; the Calvin cycle happens in the stroma.`;
  - link "Photosynthesis explained", URL `https://en.wikipedia.org/wiki/Photosynthesis`.
- "Week 3: Genetics" (draft): page "Mendel and peas", body `Gregor Mendel's experiments with pea plants revealed the basic rules of inheritance.`

HIS201: "Unit 1: The 1848 revolutions" (published): page "Reading list", body `1. Mike Rapport, 1848: Year of Revolution` and `2. Jonathan Sperber, The European Revolutions, 1848–1851`.

### Announcements

Author of all three is Dr. Ingrid Solberg. Maya has read Welcome to BIO101 (20 days ago) and Reading list posted (a little after it was posted); every other announcement is Unread for every student until that student opens it.

| Course | Title | Body | Pinned | Posted |
|---|---|---|---|---|
| BIO101 | Welcome to BIO101 | Welcome! Start with the syllabus in Week 1. Labs begin next week. | yes | 21 days ago |
| BIO101 | Lab report 1 marking update | Lab reports are being marked this week. Released grades show up under Grades. | no | 3 days ago |
| HIS201 | Reading list posted | The reading list for Unit 1 is now in Modules. | no | 2 days ago |

### Assignments

| Course | Title | Due | Points | Accepts | Late work | State | Instructions |
|---|---|---|---|---|---|---|---|
| BIO101 | Safety acknowledgement | T-14d | 10 | text | not allowed (closed) | published | Confirm that you have read the lab safety rules by typing "I have read the safety rules". |
| BIO101 | Lab report 1 | T-7d | 100 | file and text | allowed | published | Write up the cell observation lab: aim, methods, results (with a labelled table) and conclusion. Max 4 pages. |
| BIO101 | Photosynthesis worksheet | T+2d | 50 | text | allowed | published | Read the Photosynthesis overview (Modules, Week 2), then explain in your own words where the light reactions and the Calvin cycle happen. |
| BIO101 | Field journal | T+21d | 100 | file | allowed | published | Keep a two-week field journal of plant life near you. Upload it as one PDF. |
| BIO101 | Final project | T+60d | 100 | file and text | allowed | draft | A short research project on a topic of your choice. Details to follow. |
| HIS201 | Essay: the 1848 revolutions | T+5d | 100 | file and text | allowed | published | 1500 words: why did the 1848 revolutions fail? |
| HIS201 | Source analysis | T+30d | 50 | file and text | allowed | published | Analyse one primary source from the reading list. |

### Submissions and grades (BIO101)

| Assignment | Student | Submitted | Content | Grade |
|---|---|---|---|---|
| Safety acknowledgement | Maya | 16 days ago | text `I have read the safety rules` | 10 / 10, released, feedback `Thanks!`, graded 13 days ago |
| Lab report 1 | Maya | T-8d 23:59 (one day before the due time) | text `My lab report is attached.`, file `lab-report-1.pdf` | 86 / 100, released, feedback `Clear methods section. Add units to Table 2 and cite the microscope model.`, graded 2 days ago |
| Lab report 1 | Liam | T-7d 22:59 (one hour before the due time) | text `Observations: onion cells showed clear cell walls and nuclei. Conclusion: plant cells have rigid walls.` | 72 / 100, draft (not released), feedback `Good observations; the conclusion needs evidence from your data.` |
| Lab report 1 | Sofia | T-6d 23:59 (exactly one day after the due time) | text `Sorry this is late. Report text: cells observed under 400x magnification.` | not graded |
| Photosynthesis worksheet | Liam | 1 day ago | text `Light reactions occur in the thylakoid membrane.` | not graded |

Everything else has no submission: Liam, Sofia and Noah have not submitted Safety acknowledgement (Closed); Noah has not submitted Lab report 1 (Missing, still open for late work); Maya, Sofia and Noah have not submitted Photosynthesis worksheet; nobody has submitted Field journal or any HIS201 assignment. Counts that follow from this: Ingrid has 2 submissions that need grading (Sofia's Lab report 1, Liam's Photosynthesis worksheet) in BIO101 and 0 in HIS201.

### Discussions

BIO101 thread "Question about the lab report" by Liam Hansen, 5 days ago: `Should the methods section list the microscope model?` Two replies: Dr. Ingrid Solberg `Yes, please include it.` (about 4.9 days ago) and Maya Okafor `Thanks, I wondered too.` (about 4.8 days ago).

### Notifications

Each announcement notified every student of its course when it was posted, as the app does, and the notification is read where the student has read the announcement. Maya also has one grade notification. Teachers, the admin and Priya have none.

| Who | Title | Created | State |
|---|---|---|---|
| Maya | Grade released: Lab report 1 (links to the Lab report 1 page) | 2 days ago, a few milliseconds after "Reading list posted" | unread |
| Maya, Liam | New announcement: Reading list posted (links to the HIS201 announcement) | 2 days ago | read for Maya, unread for Liam |
| Maya, Liam, Sofia, Noah | New announcement: Lab report 1 marking update (links to the BIO101 announcement) | 3 days ago | unread |
| Maya, Liam, Sofia, Noah | New announcement: Welcome to BIO101 (links to the BIO101 announcement) | 21 days ago | read for Maya, unread for the others |

So Maya has four notifications, two unread; Liam three unread; Sofia and Noah two unread. The relative order of the two notifications created 2 days ago is not fixed by the seed, so tests must not assert it. Notification preferences are not seeded: all five kinds are on for everyone.

## Conventions the stories rely on

- **Top bar** on every page: Scientia logo (to the dashboard), Calendar, Notifications bell, the user's name with a menu holding Settings and Sign out. Admins also see Admin.
- **Course navigation** is the same in every course for every role: Home, Modules, Assignments, Announcements, Discussions, Grades, People. Teachers see Grading and Gradebook in place of Grades, after Discussions: Home, Modules, Assignments, Announcements, Discussions, Grading, Gradebook, People.
- **Student statuses** on an assignment: Not submitted, Submitted, Late, Missing, Closed, Graded. A Graded status only appears after the teacher releases the grade.
- **Teacher grade states**: Needs grading, Graded (not released), Released.
- **Grades** are never set automatically. A Missing assignment is not a zero.
- **Notifications** are in-app only. No email is sent in M3. There are five kinds: New announcement, New assignment, Due date changed, Grade released, Replies to me. All five are on by default.
- **Delete actions** ask for confirmation.
- **Announcement order:** pinned first, then newest first. Discussion thread order: newest first.

## Story index

| Id range | File | Actor | Count |
|---|---|---|---|
| US-1 to US-21 | `student.md` | student | 21 |
| US-22 to US-37, US-45 | `teacher.md` | teacher | 17 |
| US-38 to US-44, US-46 | `admin.md` | admin | 8 |

## Seed changes requested (resolved)

Both were applied in `supabase/migrations/0003_roles_and_privacy.sql` (ADR 0006): accounts now have a `role` (Alex admin, Ingrid teacher, others student), and emails are only readable through `course_people()` (teachers), `enrol_by_email()` and `admin_users()` (admins).

## Review responses

Findings are from `docs/process/reviews/m2-stories-testability.md` (B = blocker, S = should-fix, N = nit) and `m2-stories-research-fit.md` (SF = should-fix, N- = nit). Counts: 38 blockers and should-fix, 34 fixed, 3 fixed in part, 1 declined.

| Finding | Result | Note |
|---|---|---|
| B1 | fixed | `reset()` in `beforeEach`, described above. |
| B2 | fixed | Maya's text and file are seeded; US-13 asserts them. |
| B3 | fixed | Sofia's text was already in the seed; US-30 asserts it. |
| B4 | fixed | US-43 uses `/rest/v1/profiles` and `/api/admin/users` with named expectations. |
| B5 | fixed | Export is a client-side download; US-33 checks the download event and `/rest/v1/grades` for Maya. |
| S1 | fixed in part | The seed uses the real clock and tests compute dates from the time of `reset()`; the browser clock is not frozen. |
| S2 | fixed in part | Timestamps and body texts added. Route table declined: routes belong to `docs/design/ia.md`; tests capture URLs through the interface. |
| S3 | fixed | US-4 gives the due date as T-7d. |
| S4 | fixed | Page texts added to the seed description and US-6. |
| S5 | fixed | The seed stores `cell-structure.pdf`; the fixture path in the review was wrong. |
| S6 | fixed | Seeded URL; US-6 checks `href`, `target`, `rel` and does not follow the link. |
| S7 | fixed | Instructions are in the seed and US-8. |
| S8 | fixed | US-9 fixes the click count at 2 and the time rule is in "How tests use the demo data". |
| S9 | fixed | US-11 uses `/rest/v1/submissions` with expectations. |
| S10 | fixed | US-12 gives Liam's total as "No released grades yet". |
| S11 | fixed | US-13 uses the data API instead of a URL. |
| S12 | fixed | US-14 navigates with Next/Previous to computed dates. |
| S13 | fixed | No other account has notifications in the seed; US-16 names the announcement "Field trip". |
| S14 | fixed | US-16 asserts Maya's count stays 1. |
| S15 | fixed in part | Timestamps added. The order of the two notifications created 2 days ago is not seeded, so US-17 asserts only the oldest one last. |
| S16 | fixed | US-20 lists the pages. |
| S17 | fixed | US-21 no longer submits; it checks the form is visible. |
| S18 | fixed | US-21 checks scrollWidth, clipping and 16 px font size. |
| S19 | fixed | US-25 states the position below the pinned post. |
| S20 | fixed | US-29 sorts by due date. |
| S21 | fixed | US-30 names the in-app dialog and its buttons. |
| S22 | fixed | US-31 saves its own drafts and quotes the dialog. |
| S23 | fixed | US-36 asserts the page heading. |
| S24 | fixed | US-39 gives the empty-dashboard text. |
| S25 | fixed | US-1 captures the Assignments URL while signed in. |
| SF-1 | fixed in part | US-9 keeps typed text when a submission fails. The 2-second dashboard criterion is declined; performance beyond bundle size is in "Later". |
| SF-2 | fixed | US-20 requires the teacher pages to be visited under the automatic axe scan. |
| SF-3 | fixed | Announcement expiry and archiving added to "Later". |
| SF-4 | fixed | Principle 3 now reads "never for cosmetic edits". |
| SF-5 | declined | Orchestrator decision: all five kinds stay on by default; calm comes from having only five meaningful kinds. Stated in the synthesis. |
| SF-6 | fixed | US-21 checks the phone dashboard and Ingrid's grading view. |
| SF-7 | fixed | US-37 evidence says there is no research source. |
| SF-8 | fixed | US-43 evidence says it is a security baseline. |

Nits were applied where the text allowed an exact value (N1 to N22 and N-1 to N-8). The ones not applied literally: N22 (US-5 and US-22 both list their navigation; each now lists only its own role's full list), N7 (landmark counts replaced by "every navigation has a unique label", because the number of menus is a design decision), N-5 (US-16 evidence trimmed instead of adding an out-of-scope note).
