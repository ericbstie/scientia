# Review: user stories (M2 brief), lens "testability"

- **Reviewer:** reviewer (lens: testability)
- **Scope:** `docs/stories/README.md`, `student.md` (US-1 to US-21), `teacher.md` (US-22 to US-37), `admin.md` (US-38 to US-43)
- **Test for each criterion:** can a Playwright test check it deterministically against the seed in README.md (with T = seed time)?
- **Severity:** blocker = no test can be written from the text, or the seed cannot support it. should-fix = checkable only after a clarification, or flaky. nit = wording that a test would have to guess.

## Counts

- Blockers: 5
- Should-fix: 25
- Nits: 22

## Blockers

### B1. README (all stories): no reseed mechanism
- **File:** `docs/stories/README.md:23`
- **Criterion:** "Tests that change data must reseed first."
- **Problem:** No command, endpoint or fixture is named for reseeding, and nothing says how T is passed to the seed. Every test that writes data (about 30 criteria) depends on this, so none can start from a known state.
- **Rewrite:** Add: "Reseed: `<exact command>` restores this seed and takes T as an argument. Each Playwright test calls it in `beforeEach` and sets the browser clock to T with the Playwright clock API."

### B2. US-13: seed does not define Maya's submission
- **File:** `docs/stories/student.md:185`
- **Criterion:** "Given I am signed in as Maya, When I open Lab report 1 from the Grades page, Then I see "86 / 100", the feedback "Clear methods section. Add units to Table 2 and cite the microscope model.", and my submitted text and file."
- **Problem:** The README says Maya "submitted on time" (README.md:72) but gives no text and no file for her submission. "my submitted text and file" has no expected value, so the test cannot assert it.
- **Rewrite:** Add to README: "Maya's Lab report 1 text is `<exact text>` and it has one file `<name>` (a fixture)." Then: "...and I see the text `<exact text>` and a link named `<file name>`."

### B3. US-30: seed does not define Sofia's submitted text
- **File:** `docs/stories/teacher.md:128`
- **Criterion:** "Given I open Sofia's Lab report 1, When the grading view loads, Then I see her submitted text, the points possible (100), a Score field and a Feedback field."
- **Problem:** Sofia's submission content is not in the seed (README.md:72 says only "submitted late"). "her submitted text" cannot be asserted.
- **Rewrite:** Add Sofia's text to the seed as `<exact text>`, and change the criterion to "...Then I see the text `<exact text>`, the points possible (100), a Score field and a Feedback field."

### B4. US-43: API endpoint not named, and "no user data" not checkable
- **File:** `docs/stories/admin.md:87`
- **Criterion:** "Given I am signed in as Maya, When I request the user list API endpoint, Then the response status is 403 and the body contains no user data."
- **Problem:** No path or method for the endpoint appears in any story or the README, so the request cannot be written. "no user data" names no fields or values to search for.
- **Rewrite:** "Given I am signed in as Maya, When I send GET `<exact path>`, Then the response status is 403 and the body does not contain `okafor`, `hansen`, `reyes`, `berg` or `nair`."

### B5. US-33: export endpoint not named, access-denied response not defined
- **File:** `docs/stories/teacher.md:175`
- **Criterion:** "Given I am signed in as Maya, When I request the export URL, Then I receive an access-denied response and no file."
- **Problem:** "the export URL" is not defined anywhere. "an access-denied response" has no status code or text.
- **Rewrite:** "Given I am signed in as Maya, When I send GET `<exact export path>`, Then the response status is 403 and no file is returned (no Content-Disposition header)."

## Should-fix

### S1. README (time): wall clock is not fixed
- **File:** `docs/stories/README.md:23`
- **Criterion:** "T" is the moment the seed runs. All times are UTC and the Playwright browser runs in UTC."
- **Problem:** Nothing says the browser clock is fixed at T. Criteria that read "today" or "the current month" (US-14, US-25) and the submission time (US-9) change with the run date. The README also does not say that T is stored, so a later test run cannot recompute T+N dates.
- **Rewrite:** Add: "Tests set the browser clock to T with the Playwright clock API. Every expected date is computed from T in the test, and T is written to the seed log."

### S2. README: seed has no timestamps and no route table
- **File:** `docs/stories/README.md:59-79`
- **Criterion:** Several (US-17 c2, US-29 c1, US-11 c5, US-13 c3, US-33 c4, US-43 c1-c4)
- **Problem:** The seed gives no timestamps for submissions (Liam's Photosynthesis, Sofia's late Lab report), notifications (Maya's three), or announcements other than "T-21d" style offsets. It also gives no URL paths for Admin, Gradebook, Grading, export or API, and no body text for pages or instructions.
- **Rewrite:** Add a table of exact timestamps (`ddd D MMM, HH:mm`) for each submission, notification and announcement, a route table (paths and methods), and the body text for each page and assignment.

### S3. US-4 c1: relative due date
- **File:** `docs/stories/student.md:57`
- **Criterion:** "Then a "Missing" section lists Lab report 1 (BIO101, due 7 days ago, with a "Submit late" link)"
- **Problem:** "due 7 days ago" is relative to the run date, so the expected text changes every day.
- **Rewrite:** "...lists Lab report 1 (BIO101, due `<T-7d as ddd D MMM, 23:59>`), with a "Submit late" link."

### S4. US-6 c2: page text not seeded
- **File:** `docs/stories/student.md:86`
- **Criterion:** "Given I open the page item "Welcome and syllabus", When it loads, Then its title and text are shown and a link back to Modules is present."
- **Problem:** The page body is not in the seed, so "text" has no expected value.
- **Rewrite:** Seed the body as `<exact text>` and assert it: "...its title `Welcome and syllabus` and the text `<exact text>` are shown..."

### S5. US-6 c3: file bytes for cell-structure.pdf not in fixtures
- **File:** `docs/stories/student.md:87`
- **Criterion:** "Given I click the file item `cell-structure.pdf`, When the download starts, Then the downloaded file is named `cell-structure.pdf`."
- **Problem:** `cell-structure.pdf` is a seeded module item (README.md:46), but README.md:83 lists only `sample.pdf` and `too-large.bin` as fixtures. The file has no defined content, so the download cannot be made deterministic.
- **Rewrite:** Add `e2e/fixtures/cell-structure.pdf` to README.md:83 as the file attached to "Week 1: Cells" at seed time.

### S6. US-6 c4: external link opens the real site
- **File:** `docs/stories/student.md:88`
- **Criterion:** "Given I click the link item "Khan Academy: Cell biology", When it opens, Then it opens in a new tab with `rel="noopener"`."
- **Problem:** The seed gives no URL for this link, so the test cannot check where it goes. Opening a real external site also makes the test depend on the network.
- **Rewrite:** Seed the URL as `<stub URL>`. Assert the anchor has `target="_blank"` and `rel="noopener"`, and do not follow the link.

### S7. US-8 c3: instructions not seeded
- **File:** `docs/stories/student.md:115`
- **Criterion:** "Given I open Photosynthesis worksheet, When it loads, Then I see its instructions, "50 points", the due date, and that it accepts text entry."
- **Problem:** The instructions text is not in the seed.
- **Rewrite:** Seed the instructions as `<exact text>` and assert it.

### S8. US-9 c1: submission time is wall-clock dependent
- **File:** `docs/stories/student.md:127`
- **Criterion:** "Then no more than three clicks were used, the page shows status "Submitted" with the submission time, and my text is displayed."
- **Problem:** The submission time is the moment of the click. "no more than three clicks" is countable but the test has to define what it counts.
- **Rewrite:** "...the page shows status "Submitted" and the submission time in `ddd D MMM, HH:mm` equal to the frozen clock (T). The click count is exactly 2 (Photosynthesis worksheet row, then Submit)."

### S9. US-11 c5: "directly" has no endpoint or payload
- **File:** `docs/stories/student.md:160`
- **Criterion:** "Given I send a submission to the closed assignment directly, When the server rejects it, Then the response message says the assignment is closed and is not a generic failure."
- **Problem:** No endpoint, payload or status code is defined. "says the assignment is closed" has no expected string.
- **Rewrite:** "Given I am signed in as Liam, When I POST text to `<exact endpoint>` for Safety acknowledgement, Then the response status is `<code>` and the message is `<exact text>`."

### S10. US-12 c4: Liam's total not defined
- **File:** `docs/stories/student.md:174`
- **Criterion:** "...and Safety acknowledgement shows "Missing" without a zero or a penalty in the total."
- **Problem:** The student total for Liam is never stated. US-32 gives 72.0% only for the teacher gradebook, and that grade is a draft. "without a penalty in the total" has no value to check.
- **Rewrite:** "...and the total shows `<exact text>` (for example `0 of 0 points graded so far`)."

### S11. US-13 c3: URL of Liam's submission not defined
- **File:** `docs/stories/student.md:187`
- **Criterion:** "Given I am signed in as Maya, When I open the URL of Liam's Lab report 1 submission, Then I see a "not found" page and none of his work."
- **Problem:** The route pattern is not defined and the seed has no ids. "none of his work" is not checked against any text.
- **Rewrite:** Name the route in the README (for example `/courses/BIO101/assignments/<id>/submissions/<id>`). Assert the heading is `Not found` and the text `Good observations; the conclusion needs evidence from your data.` is absent.

### S12. US-14 c1 and c4: month view depends on the clock
- **File:** `docs/stories/student.md:198` and `:201`
- **Criterion:** "Then a month view opens on the current month with Photosynthesis worksheet and Essay: the 1848 revolutions on their due days" and "Then the current month is shown and today's date is marked."
- **Problem:** The expected month depends on the wall clock. Photosynthesis (T+2d) and Essay (T+5d) fall in the next month when T is in the last days of a month, which makes c1 false for some run dates. "today's date is marked" has no fixed check.
- **Rewrite:** "With the clock at T, the month view opens on the month containing T, shows Photosynthesis worksheet on `<T+2d>` and Essay on `<T+5d>`." For c4: "the cell for `<T>` has `aria-current="date"`."

### S13. US-16 c1: no baseline for "exactly one"
- **File:** `docs/stories/student.md:227`
- **Criterion:** "Given Ingrid posts a BIO101 announcement and then edits its text, When Maya, Liam, Sofia and Noah open their notifications, Then each has exactly one "New announcement" notification, and Priya has none."
- **Problem:** The seed does not say what notifications Liam, Sofia, Noah or Priya already have, and the announcement title is not given.
- **Rewrite:** Seed the notifications for all seven accounts. Name the announcement, for example `"<exact title>"`, and assert: "the count of notifications titled `New announcement: <exact title>` is 1 for each of the four students and 0 for Priya."

### S14. US-16 c4: "no new one" has no baseline
- **File:** `docs/stories/student.md:230`
- **Criterion:** "Then Liam has one "Grade released: Lab report 1" notification and Maya has no new one."
- **Problem:** Maya already has a seeded "Grade released: Lab report 1" notification (README.md:79), so "new" is ambiguous.
- **Rewrite:** "...and Maya's count of "Grade released: Lab report 1" notifications is still 1 (the seeded one)."

### S15. US-17 c2: "newest first" cannot be checked
- **File:** `docs/stories/student.md:243`
- **Criterion:** "Then it shows three notifications newest first, with the two unread ones marked "Unread"."
- **Problem:** The seed has no timestamps for notifications. "New announcement: Reading list posted" is posted T-2d and "New announcement: Lab report 1 marking update" is posted T-3d, so their order is set by the seed. The grade-release notification's time is not given, so the full order is undefined.
- **Rewrite:** Seed three timestamps and assert the list order: "...shows, in order, `<title 1>`, `<title 2>`, `<title 3>`."

### S16. US-20 c1: "any page" is not enumerated
- **File:** `docs/stories/student.md:284`
- **Criterion:** "Given any page has loaded, When I press Tab once, Then the first focus is a "Skip to main content" link and activating it moves focus into the main region."
- **Problem:** "any page" is not a list, so a test cannot be scoped. The test has to choose pages itself.
- **Rewrite:** "Given each of these pages has loaded (sign-in, dashboard, course home, assignment page, gradebook, admin users), When I press Tab once, ..."

### S17. US-21 c3: duplicates US-9 c1
- **File:** `docs/stories/student.md:301`
- **Criterion:** "Given the same viewport, When I submit text to Photosynthesis worksheet, Then the submission succeeds and the status shows "Submitted"."
- **Problem:** Two stories test the same submit path (US-9 c1, student.md:127). A failure is reported twice, and the two checks can drift apart.
- **Rewrite:** Keep the submit check in US-9. Change this criterion to: "Given the same viewport, When I open Photosynthesis worksheet, Then the text field and Submit button are fully visible without horizontal scrolling."

### S18. US-21 c4: "readable" is not checkable
- **File:** `docs/stories/student.md:302`
- **Criterion:** "Given a 320 pixel wide viewport, When I open the Assignments list, Then all text remains readable without horizontal scrolling."
- **Problem:** The horizontal-scroll part is checkable. "readable" is not.
- **Rewrite:** "...Then the page has no horizontal scroll (scrollWidth equals clientWidth), no text element is clipped, and the computed font size of body text is at least 16px."

### S19. US-25 c1: "top of the list" conflicts with pinned order; "today's date" is clock-dependent
- **File:** `docs/stories/teacher.md:57`
- **Criterion:** "Then it appears at the top of the list with my name and today's date."
- **Problem:** Pinned items sort first (student.md:99, teacher.md:71), so an unpinned post cannot be at the top. "today's date" depends on the clock.
- **Rewrite:** "Then it appears directly below the pinned "Welcome to BIO101", above "Lab report 1 marking update", with my name and the date `<T as ddd D MMM>`."

### S20. US-29 c1: "oldest first" has no sort key
- **File:** `docs/stories/teacher.md:113`
- **Criterion:** "...shows exactly two rows, oldest first: Sofia Reyes, Lab report 1, ... and Liam Hansen, Photosynthesis worksheet."
- **Problem:** "oldest" can mean due date or submission time. Liam's Photosynthesis submission time is not seeded, so the order by submission time is undefined.
- **Rewrite:** "...sorted by due date, earliest first (Sofia's Lab report 1 due `<T-7d>`, then Liam's Photosynthesis worksheet due `<T+2d>`)."

### S21. US-30 c5: "a confirmation" and "leave the page" are not defined
- **File:** `docs/stories/teacher.md:132`
- **Criterion:** "Given I leave the page after typing but before saving, When a confirmation about unsaved changes appears and I choose to stay, Then my typing is still there."
- **Problem:** The target of "leave the page" is not defined. The confirmation could be the native beforeunload dialog or an in-app modal, and the test code differs for each. "choose to stay" is undefined for a native dialog.
- **Rewrite:** "Given I type 80 in Score on Sofia's Lab report 1 and click Grading in the course navigation, When the in-app dialog `<exact title>` appears and I click `<Stay button>`, Then the Score field still shows 80."

### S22. US-31 c2: setup depends on US-30 drafts and dialog text is missing
- **File:** `docs/stories/teacher.md:144`
- **Criterion:** "Given three graded-not-released submissions exist (Liam's Lab report 1 plus drafts I saved for Sofia's Lab report 1 and Liam's Photosynthesis worksheet), When I click "Release all graded (3)" and confirm the count in the dialog, Then all three move to "Released" and the button disappears."
- **Problem:** The two extra drafts are not in the seed. Their scores are not given. The test has to run US-30 first, which couples the two stories. The dialog text is not defined, so "confirm the count" cannot be checked.
- **Rewrite:** "Given the seed, plus Sofia's Lab report 1 saved as draft with score 78 and Liam's Photosynthesis worksheet saved as draft with score `<n>`, When I click "Release all graded (3)", Then the dialog text is `<exact text>`, and after confirming, all three move to "Released"..."

### S23. US-36 c2: a URL cannot show text
- **File:** `docs/stories/teacher.md:214`
- **Criterion:** "Given Sofia has been removed, When she signs in, Then BIO101 is not on her dashboard and its URL shows "You don't have access to this course"."
- **Problem:** A URL does not show text, and the course URL is not defined. The test has to check the page content.
- **Rewrite:** "Given Sofia has been removed, When she signs in and opens the BIO101 course URL `<exact path>`, Then the page heading is "You don't have access to this course"."

### S24. US-39 c2: expected dashboard wording not given
- **File:** `docs/stories/admin.md:28`
- **Criterion:** "Given Eva signs in with that password, When she lands, Then she sees an empty dashboard saying she is not enrolled in any course."
- **Problem:** The wording is not given, so a test would have to invent the expected string.
- **Rewrite:** "...Then she sees the text `<exact text>` and no course cards."

### S25. US-1 c4: sign-in deep link mechanism not defined
- **File:** `docs/stories/student.md:17`
- **Criterion:** "Given I was sent to sign in from a link to the BIO101 Assignments page, When I sign in, Then I arrive on that page and not on the dashboard."
- **Problem:** The mechanism that carries the return URL is not defined, and the BIO101 Assignments path is not given.
- **Rewrite:** "Given I open `<exact assignments path>` while signed out, When I sign in, Then the URL is `<exact assignments path>`, not the dashboard."

## Nits

### N1. US-6 c1: "their items" not enumerated
- **File:** `docs/stories/student.md:85`
- **Problem:** The expected items are not listed.
- **Rewrite:** Name the items: "Welcome and syllabus, cell-structure.pdf, Khan Academy: Cell biology" and so on.

### N2. US-9 c4: error text not given
- **File:** `docs/stories/student.md:130`
- **Problem:** "an error that names the 10 MB limit" has no exact text.
- **Rewrite:** "...an error with the text `<exact text containing "10 MB">`."

### N3. US-10 c2: which teacher page is not named
- **File:** `docs/stories/student.md:143`
- **Problem:** "a teacher opening the submission" does not name the page.
- **Rewrite:** "...Then Ingrid's grading view for that submission shows the new text and does not show the old one."

### N4. US-16 c5: notified accounts not all checked
- **File:** `docs/stories/student.md:231`
- **Problem:** "nobody is notified of the new thread" is checked only for Liam, Sofia and Noah. Ingrid and Maya are not checked.
- **Rewrite:** "...and no account other than Liam has a new "Reply" notification and no account has a notification for the new thread."

### N5. US-18 c1: notice text not given
- **File:** `docs/stories/student.md:256`
- **Problem:** "text that notifications appear in Scientia only" has no exact text.
- **Rewrite:** "...and the text `<exact text>`."

### N6. US-19 c3 and c5: error text not given
- **File:** `docs/stories/student.md:271` and `:273`
- **Problem:** "I see an error" and "an error naming the minimum length" have no exact text.
- **Rewrite:** Give the message for each case, for example `Current password is incorrect` and `Password must be at least 8 characters`.

### N7. US-20 c2: menu count not defined
- **File:** `docs/stories/student.md:285`
- **Problem:** "one `navigation` per menu with a label" does not say how many menus each page has.
- **Rewrite:** "...exactly `<n>` navigation landmarks, each with an `aria-label`."

### N8. US-23 c3: depends on Week 4 from c2
- **File:** `docs/stories/teacher.md:29`
- **Problem:** Week 4 is not in the seed. It is created in c2, so c3 depends on c2.
- **Rewrite:** "Given Week 3 is a draft and Week 4 has been created as in the previous criterion, When Maya opens BIO101 Modules, ..."

### N9. US-24 c2 and c3: publish step and error element
- **File:** `docs/stories/teacher.md:43-44`
- **Problem:** c2 needs Week 4 to be published before Maya can download, but the criterion does not say so. c3 says "a validation error" without naming the element.
- **Rewrite:** c2: "...and once I publish Week 4, Maya can download it." c3: "...I see an error linked to the URL field and the text `<exact text>`."

### N10. US-26 c1: order of two pinned posts
- **File:** `docs/stories/teacher.md:71`
- **Problem:** "the two pinned announcements above any others" does not give their order relative to each other.
- **Rewrite:** "...the two pinned announcements are listed in `<order>`, above any others."

### N11. US-27 c2 and c4: date format and error text
- **File:** `docs/stories/teacher.md:86` and `:88`
- **Problem:** c2 gives "due T+10d" without the display format. c4 says "one error for each field" with no text.
- **Rewrite:** c2: "due `<T+10d as YYYY-MM-DD>`". c4: "one error for each field, with the texts `<exact text>`."

### N12. US-30 c3: empty score error not given
- **File:** `docs/stories/teacher.md:130`
- **Problem:** "an empty score also cannot be saved" does not give the error text.
- **Rewrite:** "...and the text `<exact text>` is shown."

### N13. US-31 c4: starting state not reachable from the seed
- **File:** `docs/stories/teacher.md:146`
- **Problem:** "Given nothing is graded and unreleased" is not the seed state (Liam's Lab report 1 is graded and unreleased). The test must set up a state.
- **Rewrite:** "Given all graded submissions have been released (after "Release all graded" in the previous story), ..."

### N14. US-32 c1: sort key for rows
- **File:** `docs/stories/teacher.md:157`
- **Problem:** The row order "Noah Berg, Liam Hansen, Maya Okafor, Sofia Reyes" matches last-name sort, but the sort key is not stated.
- **Rewrite:** "...rows sorted by last name ascending."

### N15. US-35 c1, c2 and c5: case of input, unnamed assignments, error text
- **File:** `docs/stories/teacher.md:198`, `:199`, `:202`
- **Problem:** c1 enters `PRIYA.NAIR@scientia.test` in capitals without saying that matching is case-insensitive. c2 says "its assignments appear in Upcoming" without naming them. c5 says "an error that only student accounts can be added" with no text.
- **Rewrite:** c1: "Emails match case-insensitively." c2: "...Photosynthesis worksheet and Field journal appear in Upcoming." c5: "...the text `<exact text>`."

### N16. US-38 c1: status values not seeded
- **File:** `docs/stories/admin.md:14`
- **Problem:** "status" for each account is not in the seed (the README gives only roles).
- **Rewrite:** Seed the status of each account, for example "Active" for all seven.

### N17. US-41 c1: confirmation text not given
- **File:** `docs/stories/admin.md:55`
- **Problem:** "I see a confirmation" has no text.
- **Rewrite:** "...I see the text `<exact text>`."

### N18. US-42 c2, c4 and c5: navigation, code value, error text
- **File:** `docs/stories/admin.md:70`, `:72`, `:73`
- **Problem:** c2 says "the standard course navigation" without naming it. c4 says "a code that already exists" without giving the value. c5 says "an error" without the text.
- **Rewrite:** c2: "...navigation Home, Modules, Assignments, Announcements, Discussions, Grading, Gradebook, People." c4: "I enter code BIO101, ...". c5: "...the text `<exact text>`."

### N19. US-39 c4: example error messages
- **File:** `docs/stories/admin.md:30`
- **Problem:** "I see an error for each invalid field" does not give the messages or which field gets which.
- **Rewrite:** "...the email field shows `<text>` and the password field shows `<text>`."

### N20. US-43 c3: "no grade data" not checkable
- **File:** `docs/stories/admin.md:86`
- **Problem:** "no grade data" does not name any value to check for.
- **Rewrite:** "...and the page does not contain `86`, `72` or `Released`."

### N21. US-16 c4 and US-31 c1: same behaviour in two stories
- **File:** `docs/stories/student.md:230`; `docs/stories/teacher.md:143`
- **Problem:** Both stories release Liam's Lab report 1 grade and check the result. The notification check in US-16 and the Grades page check in US-31 are different outcomes, but the setup is duplicated.
- **Rewrite:** Keep the release step in US-31. US-16 c4 checks only the notification and says "Given Liam's grade has been released (US-31 c1)."

### N22. US-22 c3 and US-5 c1-c2: same navigation list checked in two stories
- **File:** `docs/stories/teacher.md:16`; `docs/stories/student.md:71-72`
- **Problem:** Both check the course navigation list and order. The teacher version adds Grading and Gradebook, so the two are not identical, but the shared part is tested twice.
- **Rewrite:** Keep the student check in US-5 and the teacher check in US-22 with only the teacher items.

## Verdict

Not testable as written: fix the 5 blockers (reseed, Maya's and Sofia's submission content, two API endpoints, and the export endpoint) and the 25 should-fix items (clock and seed timestamps first) before Milestone 3 test work starts; nits can follow.
