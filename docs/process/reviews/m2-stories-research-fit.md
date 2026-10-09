# Review: M2 user stories, lens "research fit"

- **Reviewer:** reviewer (haiku), lens: research fit only
- **Brief:** `docs/process/briefs/m2-review-stories.md`
- **Inputs read:** `docs/stories/README.md`, `student.md`, `teacher.md`, `admin.md`; `docs/research/synthesis.md`, `pain-points.md`, and the Pain points, Worth copying and Worth avoiding sections of `blackboard.md`, `canvas.md`, `moodle.md`, `google-classroom.md`, `brightspace-itslearning.md`, `design-patterns.md`
- **Method:** each of the 10 top pain points in `synthesis.md` (lines 41 to 50) was traced to the story ids that answer it. Each story's Evidence line was checked against the cited research item. Research pain points outside the top 10 were checked for a story or a Later entry.

## Counts

- Blockers: 0
- Should-fix: 8
- Nits: 8

## Coverage of the top 10 pain points

| # | Pain point (synthesis.md) | Stories that address it | Status |
|---|---|---|---|
| 1 | Deadlines hidden or incomplete | US-3 (P0), US-4 (P1), US-14 | Covered. Mobile to-do check missing, see SF-6 |
| 2 | Notification floods | US-16, US-17, US-18 | Covered. See SF-3, SF-4, SF-5 |
| 3 | Every course looks different | US-5, US-6, US-23, US-24 | Covered |
| 4 | Too many clicks, deep navigation | US-9 (three clicks or fewer), US-22 (one click to the queue), US-30 ("Next to grade") | Covered for the stated paths |
| 5 | Grades wrong, late, hidden | US-12, US-31, US-32 | Covered |
| 6 | Silent defaults | US-12, US-32 (no automatic zeros), US-23 and US-27 (drafts), US-31 (Withdraw) | Covered |
| 7 | Unclear deadline rules, vague errors | US-11, US-27 | Covered |
| 8 | Accessibility barriers | US-20, US-21, US-1 | Partly covered. Teacher pages outside the axe scope, see SF-2 |
| 9 | Setting sprawl for teachers | US-27 | Covered |
| 10 | Slowness, lost work, no undo | US-2 (stays signed in on reload), US-31 (Withdraw) | Gap for slowness and for lost typed work, see SF-1 |

No top-10 pain point lacks a story.

## Should-fix

### SF-1. Slowness is claimed as answered but no story covers it (US-2, US-9, US-31)

- **Where:** `docs/research/synthesis.md:50` ("Design response: confirmations, Withdraw release (US-31), persistent sessions (US-2)"). Research: `blackboard.md` Pain points 6 (slow, crashing, freezing), `brightspace-itslearning.md` Pain point 5, `canvas.md` Pain point 5.
- **Exact text:** "Slowness, lost work and no undo. Crashes, repeated sign-ins, disappearing items, no way to withdraw a mistaken release."
- **Problem:** None of the named responses addresses slowness. US-2 covers reload only. No story sets a responsiveness expectation. For lost work, `student.md:127` to `student.md:131` do not say that typed text survives a failed submit.
- **Why it matters:** Slowness is one of the most repeated complaints in the research, and the synthesis presents it as handled.
- **Severity:** should-fix
- **Proposed rewrite:** Add to US-9 (`student.md:130`): "Given the submit request fails, When the error appears, Then my typed text is still in the field and the message says the work was not saved." Add a responsiveness criterion to US-3, for example: "Given the seed data, When the dashboard opens, Then the Upcoming list is visible within 2 seconds." The testability lens may need to adjust the timing check. If slowness is deliberately out of M3, say so in the Later list of `synthesis.md` and remove it from the top-10 response.

### SF-2. Automated accessibility check covers only four student pages (US-20)

- **Where:** `docs/stories/student.md:288`
- **Exact text:** "Given an automated axe-core run on the dashboard, course home, assignment page and gradebook, When it finishes, Then it reports zero serious or critical violations."
- **Problem:** The research says the accessibility failure that matters most includes publishing content. `moodle.md` Pain points 17 and `pain-points.md:61` cite screen-reader users who could not publish content without help. The axe scope leaves out the teacher pages that carry this risk: Modules (US-23), the new-assignment form (US-27), the grading view (US-30), Discussions (US-15) and the Calendar (US-14).
- **Severity:** should-fix
- **Proposed rewrite:** Replace the list with: "...on the dashboard, course home, assignment page, gradebook, Modules, the New assignment form, the grading view, a discussion thread and the calendar, signed in as Maya and as Ingrid..."

### SF-3. Announcement volume and expiry are not addressed (US-7, US-25, US-26)

- **Where:** `docs/research/pain-points.md:57` (Pain point 7, announcement fatigue) and `:71` (Worth copying: "Post few announcements and expire them. Remove old posts after about two weeks and cap the active count"). Synthesis top-10 #2 cites pain 7 at `synthesis.md:42`.
- **Exact text:** US-26 Given/When/Then covers only pin, unpin, edit and delete (`teacher.md:70` to `teacher.md:74`).
- **Problem:** US-16 limits duplicate notifications and US-18 lets students switch them off, but neither addresses the number of announcements. The expiry and cap advice is not in the synthesis Later list either, so it has been dropped without a recorded decision.
- **Severity:** should-fix
- **Proposed rewrite:** Preferred: add a Later entry to `synthesis.md` (after line 87): "Announcement expiry and an active-post cap (Sussex advice, pain-points.md:71): deferred, pinning covers the M3 case." Alternative: add to US-26: "Given an announcement is older than 14 days, When Maya opens BIO101 Announcements, Then it is under an Older heading."

### SF-4. A due-date notification contradicts the stated principle on edits (US-16)

- **Where:** `docs/stories/student.md:229` and `docs/research/synthesis.md:56`
- **Exact text (story):** "Given Ingrid changes the due date of Field journal, When the four BIO101 students check, Then each has exactly one 'Due date changed: Field journal' notification."
- **Exact text (principle 3):** "Notify once per event, never for edits, and only for things that concern the person."
- **Problem:** A due-date change is an edit. The story is reasonable (it affects planning), but the principle as written forbids it. The two documents disagree, and a builder cannot tell which rule wins.
- **Severity:** should-fix
- **Proposed rewrite:** Amend principle 3 in `synthesis.md:56` to read "never for edits, except a due-date change, which affects planning". Alternatively, move criterion 3 of US-16 to the Later list.

### SF-5. Default notification settings are all on, against the calm-by-default principle (US-18)

- **Where:** `docs/stories/student.md:256`. Principle: `docs/research/synthesis.md:56` ("Calm by default"). Matrix: `synthesis.md:33` ("calm defaults"). Research: `canvas.md` Pain point 2 and `pain-points.md:39` (noisy defaults, and "many students never change their settings").
- **Exact text:** "...switches for New announcement, New assignment, Due date changed, Grade released and Replies to me, all on by default..."
- **Problem:** The research names noisy defaults as the cause of the problem. The story repeats the default that causes it, and the synthesis claims calm defaults.
- **Severity:** should-fix
- **Proposed rewrite:** Set each default explicitly. One option: on for Grade released, Replies to me and New announcement; off for New assignment and Due date changed, which the dashboard already shows. Then state the choice in the synthesis matrix. US-16 criteria 2 and 3 will need the switches set in the test setup.

### SF-6. Mobile checks cover only students and do not test the to-do list (US-21)

- **Where:** `docs/stories/student.md:296` (evidence) and `:299` to `:301` (criteria). Synthesis top-10 #1 cites pain 2 at `synthesis.md:41`. The research pain is at `pain-points.md:52` (mobile to-do gaps). Teacher mobile gap: `pain-points.md:64`.
- **Exact text:** "Given a 390 by 844 pixel viewport, When I open the dashboard, Course home and an assignment page as Maya, Then none of them scrolls horizontally."
- **Problem:** No criterion checks that the Upcoming list on a phone shows the same four items as desktop, which is the failure the research cites. The phone checks are all for students, though the research records a teacher-side mobile gap (teachers could not upload files from the app).
- **Severity:** should-fix
- **Proposed rewrite:** Add to US-21: "Given the same viewport, When I open the dashboard as Maya, Then Upcoming lists the same four items in the same order as on desktop." Add a teacher criterion: "Given the same viewport, When Ingrid opens a submission in the grading view, Then she can enter a score and feedback and save."

### SF-7. Evidence for the moderation story does not support it (US-37)

- **Where:** `docs/stories/teacher.md:223`
- **Exact text:** "Evidence: brightspace-itslearning.md#Pain points (1); canvas.md#Pain points (7)"
- **Problem:** Brightspace Pain point 1 is about navigation depth. Canvas Pain point 7 is about discussions being hard to follow. Neither is about removing posts. No research item supports moderation.
- **Severity:** should-fix
- **Proposed rewrite:** Replace with "Evidence: none. Enabler for the Discussions row in synthesis.md (Scientia decision: threads, teacher delete)." Or cite the research once a source is found.

### SF-8. Evidence for role-based access does not support it (US-43)

- **Where:** `docs/stories/admin.md:81`
- **Exact text:** "Evidence: blackboard.md#Pain points (10); pain-points.md#Pain points (8)"
- **Problem:** Blackboard Pain point 10 is about accidental actions and undo. Pain-points Pain point 8 is about grades. Neither concerns access control. The story is a security baseline, so it needs no pain point, but the citation is wrong.
- **Severity:** should-fix
- **Proposed rewrite:** "Evidence: enabler (security baseline). No research pain point. Required by the three fixed roles in synthesis.md (feature matrix, Roles & admin row)."

## Nits

- **N-1. US-1 (`docs/stories/student.md:11`).** The second citation, pain-points.md (15), is about the Ultra change and is unrelated to sign-in. Keep the blackboard.md item 7 citation (sign-in friction) and mark the sign-in form as an enabler.
- **N-2. US-10 (`docs/stories/student.md:139`).** Moodle Pain point 13 is about the deadline model, not resubmission. Cite `docs/research/moodle.md:31` (extra attempts) instead.
- **N-3. US-13 (`docs/stories/student.md:182`).** The evidence cites only feature descriptions. Add `docs/research/pain-points.md:23` ("feedback arrives weeks late"), which is the pain behind the feedback criteria.
- **N-4. US-18 (`docs/stories/student.md:253`).** The evidence cites "Worth copying" in `pain-points.md:70`, which also recommends digests and per-course control. US-18 has neither. Record in the synthesis Later list that digests and per-course switches are not in M3 (`synthesis.md:70` covers digests only).
- **N-5. US-16 (`docs/stories/student.md:224`).** Pain points 5 (SpeedGrader annotation duplicates) and 6 (third-party grade sync) are outside M3, which has no annotation and no integrations (`synthesis.md:14`, `:73`). Remove them from the cited list or state that they are out of scope.
- **N-6. US-19 (`docs/stories/student.md:266`).** Brightspace Pain point 11 is about Feide credentials in Norway, not profile or password changes. Mark as an enabler or narrow the citation to password recovery.
- **N-7. Generic evidence (`docs/stories/teacher.md:183`, `:195`, `:210`; `docs/stories/admin.md:11`, `:24`, `:38`).** US-34, 35, 36, 38, 39 and 40 cite only the "Features by area (Roles & admin)" paragraphs, which list common features and name no pain point. Mark them as enablers, or cite the specific research item that motivates each.
- **N-8. Research pain points with no story and no Later entry.** `docs/research/canvas.md` Pain point 6 (outages and trust in the vendor's security) and `brightspace-itslearning.md` Pain point 10 (unclear data flows) are not answered by any story, and the synthesis Later list does not mention privacy or data transparency. Add a line to `synthesis.md` Later: "Public data-use and privacy notice (canvas.md Pain point 6, brightspace-itslearning.md Pain point 10): not in M3."

## Verdict

No blockers and every top-10 pain point has a story, but the slowness response, teacher-page accessibility, announcement volume, two conflicts with the synthesis principles and three mis-cited evidence lines should be fixed before the stories are frozen.
