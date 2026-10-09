# Brief: Synthesis and user stories

- **Role / model:** analyst / sonnet
- **Milestone:** 2
- **Issue:** #1

## Goal
Turn the seven research notes into (1) a synthesis with a feature matrix and
Scientia's positioning, and (2) the committed set of user stories that Milestone 3
will build and test end to end.

## Inputs
- `docs/research/*.md` (all seven files)
- `.claude/agents/analyst.md` (story format rules)
- Product goal: students hand in work, see announcements, course material, due work
  and grades; teachers publish material, collect work and grade. Be a better designed
  Blackboard/Canvas competitor: fewer clicks, one predictable course layout, calm
  notifications, trustworthy grades, accessible (WCAG 2.2 AA).
- Constraints for M3: a web app (React + Supabase, email/password auth, file storage).
  No external integrations (LTI, SIS, video conferencing, plagiarism), no email
  delivery, no native mobile app (responsive web instead), no AI features.

## Allowed to touch
- `docs/research/synthesis.md` (create)
- `docs/stories/README.md`, `docs/stories/student.md`, `docs/stories/teacher.md`, `docs/stories/admin.md` (create)

## Acceptance criteria
- [ ] `synthesis.md` has: a feature matrix (rows = the 16 feature areas, columns = Blackboard, Canvas, Moodle, Google Classroom, Brightspace, itslearning, Scientia decision), the top 10 pain points we design against (each linked to the research file that evidences it), our 5 design principles, and a "Later" list of features deliberately not in M3 with one-line reasons.
- [ ] Every story is a heading of the exact form `### US-<n> <short title>` (n unique, sequential from 1 across all files), followed by: `**As a** … **I want** … **so that** …`, `**Priority:** P0|P1`, `**Evidence:** <research file#section>`, and `**Acceptance criteria:**` with 2–5 Given/When/Then bullets that a Playwright test can check in a browser against seeded demo data.
- [ ] 30–45 stories in total: only what M3 commits to build. Ideas beyond that go in synthesis "Later", without US ids.
- [ ] Coverage of: sign in/out; dashboard of what is due across courses; course home with one consistent layout; course material organised in modules (pages, files, links); announcements (post, read, pin); assignments (create with due date and points, submit file and/or text, resubmit before deadline, late marking); grading queue with score + written feedback and released-to-student control; student grades view; gradebook for teachers with CSV export; calendar of due dates; discussions (threads, replies); notifications with calm defaults (in-app, read/unread); course roster and enrolment by teacher (add existing user by email); admin creating courses and users; profile/settings; keyboard and screen-reader basics (one story for skip link/landmarks is enough).
- [ ] `docs/stories/README.md` lists the personas (student, teacher, admin; give each a name and a sentence) and the demo data the stories assume (e.g. a teacher with 2 courses, 4 students, assignments in past/near/far due states, one graded submission). Stories must reference only this demo data.
- [ ] No two stories test the same behaviour.

## Return
Under 200 words: files written, story count by actor and priority, any research conflicts you resolved and how.
