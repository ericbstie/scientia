# Student stories

Demo data, time rules and test conventions are in `README.md`. Ids continue across files.

### US-1 Sign in with email and password

**As a** student **I want** to sign in with my email and password **so that** I reach my own courses and work.

**Priority:** P0

**Evidence:** blackboard.md#Pain points (7); enabler (the sign-in form itself has no pain point)

**Acceptance criteria:**
- Given I am signed out, When I open the site root, Then I see a sign-in form with labelled Email and Password fields and a Sign in button.
- Given I enter maya.okafor@scientia.test and Demo-pass-123, When I press Enter, Then I land on the dashboard and the top bar shows "Maya Okafor".
- Given I enter a correct email with a wrong password, When I submit, Then I stay on the form and see one message "Email or password is incorrect" that does not say which one was wrong.
- Given I opened the BIO101 Assignments page while signed in as Maya, recorded its URL and signed out, When I open that URL and sign in, Then the URL is again the BIO101 Assignments URL and I am not on the dashboard.

### US-2 Sign out and keep pages private

**As a** student **I want** to sign out in two clicks and be sure my work is not visible afterwards **so that** I can use a shared computer safely.

**Priority:** P0

**Evidence:** blackboard.md#Pain points (7); brightspace-itslearning.md#Pain points (5)

**Acceptance criteria:**
- Given I am signed in as Maya, When I open the user menu and choose Sign out (two clicks), Then I see the sign-in form.
- Given I have just signed out, When I use the browser Back button, Then I see the sign-in form and no course content.
- Given I recorded the BIO101 course home URL while signed in and then signed out, When I open that URL, Then I am redirected to the sign-in form.
- Given I am signed in as Noah (enrolled in BIO101 only), When I open the recorded HIS201 course home URL, Then the page heading is "You don't have access to this course" and no HIS201 content is shown.
- Given I am signed in, When I reload the page, Then I am still signed in.

### US-3 See everything due across my courses

**As a** student **I want** one list of all upcoming work from every course **so that** I never miss a deadline.

**Priority:** P0

**Evidence:** pain-points.md#Pain points (1); design-patterns.md#Pain points (5, 6)

**Acceptance criteria:**
- Given I am signed in as Maya, When I open the dashboard, Then an "Upcoming" list shows exactly four items in this order: Photosynthesis worksheet (BIO101, 50 points), Essay: the 1848 revolutions (HIS201, 100 points), Field journal (BIO101, 100 points), Source analysis (HIS201, 50 points), each with course code and due date.
- Given the BIO101 draft assignment "Final project" exists, When Maya views Upcoming, Then it is not listed.
- Given I am signed in as Liam, When I open the dashboard, Then Photosynthesis worksheet shows the status "Submitted" and Essay: the 1848 revolutions shows "Not submitted".
- Given I am on the dashboard, When I click the Photosynthesis worksheet row, Then I land on that assignment's page.

### US-4 See missing and overdue work separately

**As a** student **I want** work I have not handed in shown apart from upcoming work **so that** overdue items never push current work out of sight.

**Priority:** P1

**Evidence:** design-patterns.md#Pain points (5); pain-points.md#Pain points (1)

**Acceptance criteria:**
- Given I am signed in as Noah, When I open the dashboard, Then a "Missing" section lists Lab report 1 (BIO101, due T-7d 23:59, labelled "Missing", with a "Submit" link) and not Safety acknowledgement, which can no longer be handed in and shows as "Closed" on the Assignments and Grades pages.
- Given Noah has missing items, When I read the dashboard, Then the first item in "Upcoming" is Photosynthesis worksheet, the second is Field journal, and no missing item appears inside "Upcoming".
- Given I am signed in as Maya, When I open the dashboard, Then the Missing section shows "Nothing missing".
- Given I am signed in as Noah, When I click "Submit" on Lab report 1 in the Missing section, Then I land on that assignment's page with the submission form visible.

### US-5 Open a course with the standard layout

**As a** student **I want** every course to look and navigate the same way **so that** I never have to relearn where things are.

**Priority:** P0

**Evidence:** pain-points.md#Pain points (9); canvas.md#Pain points (1); blackboard.md#Pain points (9)

**Acceptance criteria:**
- Given I am signed in as Maya, When I click the BIO101 course card on the dashboard, Then the course home opens with a left navigation listing, in order, Home, Modules, Assignments, Announcements, Discussions, Grades, People.
- Given I open HIS201 as Maya, When I compare the navigation with BIO101, Then it lists the same items in the same order, and the current page is marked with `aria-current="page"`.
- Given I am on the BIO101 course home, When it loads, Then it shows up to three announcements, pinned first ("Welcome to BIO101", marked Pinned) and unread ones marked Unread, and the two next due assignments, Photosynthesis worksheet and Field journal.
- Given I click People in BIO101, When the page loads, Then it lists Dr. Ingrid Solberg (teacher), Noah Berg, Liam Hansen, Maya Okafor and Sofia Reyes (students) by name and role, and the page text contains no "@scientia.test".

### US-6 Browse course material in modules

**As a** student **I want** course material grouped into modules of pages, files and links **so that** I can find what to read or download in one place.

**Priority:** P0

**Evidence:** blackboard.md#Worth copying; design-patterns.md#Features by area (Courses & content); google-classroom.md#Pain points (6)

**Acceptance criteria:**
- Given I am signed in as Maya, When I open BIO101 Modules, Then I see "Week 1: Cells" with the items "Welcome and syllabus", "Cell structure (PDF)" and "Khan Academy: Cell biology", then "Week 2: Photosynthesis" with "Photosynthesis overview" and "Photosynthesis explained", in that order, and I do not see "Week 3: Genetics".
- Given I open the page item "Welcome and syllabus", When it loads, Then the heading "Welcome and syllabus" and the text "Hand in work on Scientia before 23:59 on the due date." and "Office hours: Tuesdays 14:00–15:00, room B2.14." are shown, and a link back to Modules is present.
- Given I click the file item "Cell structure (PDF)", When the download starts, Then the downloaded file is named `cell-structure.pdf`.
- Given the link item "Khan Academy: Cell biology", When I inspect it, Then its `href` is `https://www.khanacademy.org/science/biology/structure-of-a-cell`, `target` is `_blank` and `rel` contains `noopener` (the test does not follow the link).

### US-7 Read announcements

**As a** student **I want** announcements in one ordered list with unread ones marked **so that** I see important news without scrolling a feed.

**Priority:** P0

**Evidence:** pain-points.md#Pain points (7); design-patterns.md#Features by area (Announcements); google-classroom.md#Worth avoiding

**Acceptance criteria:**
- Given I am signed in as Maya, When I open BIO101 Announcements, Then "Welcome to BIO101" (marked "Pinned") is first and "Lab report 1 marking update" is second, and HIS201's "Reading list posted" is not listed.
- Given Maya has not opened "Lab report 1 marking update", When the list loads, Then that row shows an "Unread" marker.
- Given I open "Lab report 1 marking update", When I return to the list, Then its Unread marker is gone.
- Given I open "Lab report 1 marking update", When the page loads, Then it shows the title, the author "Dr. Ingrid Solberg", the date three days before T, and the body "Lab reports are being marked this week. Released grades show up under Grades.", and there is no reply box.

### US-8 View an assignment and its status

**As a** student **I want** each assignment to show its instructions, due date, points and my status **so that** I know exactly what to do next.

**Priority:** P0

**Evidence:** moodle.md#Pain points (5, 13); blackboard.md#Pain points (9)

**Acceptance criteria:**
- Given I am signed in as Maya, When I open BIO101 Assignments, Then I see Safety acknowledgement, Lab report 1, Photosynthesis worksheet and Field journal, each with due date, points and status, and I do not see "Final project".
- Given the list is open, When I read the statuses, Then Maya sees Safety acknowledgement "Graded", Lab report 1 "Graded", Photosynthesis worksheet "Not submitted" and Field journal "Not submitted".
- Given I open Photosynthesis worksheet, When it loads, Then I see the instructions "Read the Photosynthesis overview (Modules, Week 2), then explain in your own words where the light reactions and the Calvin cycle happen.", "50 points", the due date T+2d 23:59 and a text field; and when I open Field journal I see a file input and no text field.
- Given I am signed in as Liam, When I read the Lab report 1 status, Then it shows "Submitted" and not "Graded", although his grade is a draft.

### US-9 Submit work as a file, text or both

**As a** student **I want** to hand in work in two clicks **so that** submitting is never the hard part.

**Priority:** P0

**Evidence:** google-classroom.md#Summary; moodle.md#Pain points (5); pain-points.md#Pain points (10)

**Acceptance criteria:**
- Given I am signed in as Maya on the dashboard, When I click the Photosynthesis worksheet row, fill in the text "Chlorophyll absorbs light." and click Submit (exactly 2 clicks), Then the page shows status "Submitted", a submission time equal to now, and the text "Chlorophyll absorbs light.".
- Given the Photosynthesis worksheet text field is empty, When I click Submit, Then I see the error "Enter your answer before submitting" linked to the field, and nothing is submitted.
- Given I open Essay: the 1848 revolutions as Maya, When I attach `sample.pdf` and click Submit, Then the status is "Submitted" and `sample.pdf` is shown as a downloadable link.
- Given I open Essay: the 1848 revolutions as Maya, When I read the file control with assistive tech, Then it is named "File Choose file" (its label and button text), and after I attach `sample.pdf` it is named "File sample.pdf Choose another file".
- Given I attach `too-large.bin` (11 MB), When I click Submit, Then I see the error "This file is larger than the 10 MB limit" and nothing is submitted.
- Given I type "Chlorophyll absorbs light." in Photosynthesis worksheet and the submit request fails (the test aborts it), When the error appears, Then the text field still holds "Chlorophyll absorbs light." and the message says "Your work was not saved. Try again."
- Given I type an answer in Photosynthesis worksheet and the page reloads before I submit, When it opens again, Then the field holds my text with the hint "Restored your unsent answer.", which goes once I type. The text is kept on this device for me only: another student signing in on the same browser sees an empty box, and it is forgotten when I submit, when I click Sign out, or after 30 days.

### US-10 Resubmit before grading starts

**As a** student **I want** to replace my submission until my teacher starts grading it **so that** I can fix mistakes.

**Priority:** P1

**Evidence:** moodle.md (extra attempts, line 31); google-classroom.md#Features by area (Assignments & submission)

**Acceptance criteria:**
- Given I am signed in as Liam and his Photosynthesis worksheet submission is ungraded, When I open it, Then I see an "Edit submission" button.
- Given I change the text to "Light reactions occur in the thylakoid membrane; the Calvin cycle is in the stroma." and submit again, When the page reloads, Then it shows the new text and the label "Edited"; and Ingrid's grading view of that submission shows the new text and not the old one.
- Given I am signed in as Liam and Lab report 1 has a draft grade, When I open it, Then there is no Edit submission button and I read "Your teacher has started grading this work".
- Given I am signed in as Maya and Lab report 1 is graded and released, When I open it, Then there is no Edit submission button and no "Your teacher has started grading this work" line, only the grade and feedback.

### US-11 Understand late and closed deadlines

**As a** student **I want** late work to be clearly marked and closed work to say why I cannot submit **so that** I am never confused by a vague error.

**Priority:** P1

**Evidence:** pain-points.md#Pain points (10); moodle.md#Pain points (13)

**Acceptance criteria:**
- Given I am signed in as Noah and Lab report 1 has passed its due date and allows late work, When I open it, Then the status is "Missing", there is a note "The due date has passed. You can still hand this in; it will be marked late.", and a submission form.
- Given I submit the text "Late but complete." to Lab report 1 as Noah, When it saves, Then the status shows "Late" instead of "Missing" and the submission time (now) is after the due date T-7d 23:59.
- Given I am signed in as Maya, who handed in Lab report 1 on time, When I open it after the due date, Then the status is not "Missing".
- Given I am signed in as Sofia, When I open Lab report 1, Then the status is "Late" and it says "Submitted 1 day late".
- Given I am signed in as Liam and Safety acknowledgement is closed, When I open it, Then I see "Closed: this assignment stopped accepting work on" followed by the due date T-14d 23:59 and "Ask your teacher if you need more time.", and there is no form.
- Given I am signed in as Liam, When I POST `{assignment_id: <Safety acknowledgement id>, student_id: <Liam's id>, body: "Too late"}` to `/rest/v1/submissions`, Then the response status is 4xx, the response message contains "closed" and not only a generic failure, and `/rest/v1/submissions` still has no row for Liam and Safety acknowledgement.

### US-12 View my grades in a course

**As a** student **I want** a grades page that only shows grades my teacher has released **so that** I can trust every number I see.

**Priority:** P0

**Evidence:** pain-points.md#Pain points (8); canvas.md#Pain points (3); design-patterns.md#Worth copying

**Acceptance criteria:**
- Given I am signed in as Maya, When I open BIO101 Grades, Then I see one row per published assignment (four rows) with released scores "10 / 10" for Safety acknowledgement and "86 / 100" for Lab report 1.
- Given the other rows are not graded, When I read them, Then Photosynthesis worksheet and Field journal each show "Not submitted" in place of a score, never "0".
- Given Maya's released scores, When I read the total, Then the last row of the table is "Total" with "96 / 110", "87.3% of graded points" and "2 of 4 assignments graded so far"; work that is not graded is not counted as zero.
- Given I am signed in as Liam, When I open BIO101 Grades, Then Lab report 1 and Photosynthesis worksheet show "Awaiting grade" and no number such as 72, Safety acknowledgement shows "Closed", and the page says "Nothing graded yet. Grades appear here when your teacher releases them."

### US-13 Read feedback on graded work

**As a** student **I want** to see my score and my teacher's written feedback next to my submission **so that** I understand what to improve.

**Priority:** P0

**Evidence:** pain-points.md#Features by area (Grading & feedback); pain-points.md (feedback arrives weeks late, line 23); design-patterns.md#Features by area (Grading & feedback)

**Acceptance criteria:**
- Given I am signed in as Maya, When I open Lab report 1 from the Grades page, Then I see "86 / 100", the feedback "Clear methods section. Add units to Table 2 and cite the microscope model.", my text "My lab report is attached." and a link named `lab-report-1.pdf`.
- Given I am signed in as Liam, When I open Lab report 1, Then I see his submitted text but no score and no feedback text.
- Given I am signed in as Maya, When I request `/rest/v1/submissions?student_id=eq.<Liam's id>` and `/rest/v1/grades?student_id=eq.<Liam's id>`, Then both responses are `[]`, and neither contains "onion cells" or "Good observations".

### US-14 See due dates on a calendar

**As a** student **I want** a month calendar of due dates across my courses **so that** I can plan my weeks.

**Priority:** P1

**Evidence:** design-patterns.md#Worth copying; blackboard.md#Features by area (Calendar & due dates)

**Acceptance criteria:**
- Given I am signed in as Maya, When I click Calendar in the top bar, Then a month view opens on the month containing today, with today's cell marked `aria-current="date"`.
- Given the calendar is open, When I click Next or Previous until the cell for T+2d is visible, Then it contains the text "BIO101 Photosynthesis worksheet"; and when I do the same for T+5d the cell contains "HIS201 Essay: the 1848 revolutions".
- Given I navigate with Next until the cell for T+21d is visible, When it loads, Then it contains "BIO101 Field journal".
- Given I click an item in the calendar, When the page loads, Then I land on that assignment's page; and given I click Today, Then the month containing today is shown with today's cell marked.

### US-15 Take part in a discussion

**As a** student **I want** to read, start and answer simple threaded discussions **so that** I can ask questions and see answers in one place.

**Priority:** P1

**Evidence:** pain-points.md#Pain points (12); design-patterns.md#Features by area (Discussions); canvas.md#Pain points (7)

**Acceptance criteria:**
- Given I am signed in as Maya, When I open BIO101 Discussions, Then I see the thread "Question about the lab report" by Liam Hansen with "2 replies".
- Given I open that thread, When it loads, Then the post "Should the methods section list the microscope model?" and then the replies "Yes, please include it." and "Thanks, I wondered too." appear in time order, and Dr. Ingrid Solberg's reply carries a "Teacher" label.
- Given I type "Same here." and click Reply, When the page updates, Then my reply appears last, with "Maya Okafor" and a time equal to now.
- Given I click New thread, enter title "Lab partner?" and a message, When I click Post, Then the thread appears first in the list.
- Given I submit a new thread with an empty title, When I click Post, Then I see the error "Enter a title" linked to the title field and no thread is created.

### US-16 Receive only the notifications that matter

**As a** student **I want** to be notified only about things that concern me, once each **so that** I keep notifications switched on.

**Priority:** P1

**Evidence:** pain-points.md#Pain points (3, 4, 7); design-patterns.md#Pain points (2); canvas.md#Pain points (2)

**Acceptance criteria:**
- Given Ingrid posts a BIO101 announcement titled "Field trip" and then edits its text, When Maya, Liam, Sofia and Noah open their notifications, Then each has exactly one notification titled "New announcement: Field trip", and Priya and Ingrid have none.
- Given Ingrid publishes the draft assignment "Final project", When the four BIO101 students check, Then each has exactly one notification titled "New assignment: Final project".
- Given Ingrid changes the due date of Field journal (a meaningful event, not a cosmetic edit), When the four BIO101 students check, Then each has exactly one notification titled "Due date changed: Field journal".
- Given Ingrid releases Liam's grade for Lab report 1, When Liam and Maya check, Then Liam has exactly one notification titled "Grade released: Lab report 1" and Maya still has exactly one (the seeded one).
- Given Maya replies to Liam's thread and also starts the thread "Lab partner?", When every account checks, Then Liam has exactly one notification titled "New reply: Question about the lab report", no other account has a "New reply" notification, and no notification title contains "Lab partner?".

### US-17 Check my notifications

**As a** student **I want** a notification list with read and unread states **so that** I can catch up in one place and clear it.

**Priority:** P1

**Evidence:** design-patterns.md#Pain points (3); google-classroom.md#Pain points (5)

**Acceptance criteria:**
- Given I am signed in as Maya, When I look at the top bar, Then the bell shows an unread count of 2.
- Given I open the bell, When the list opens, Then it shows four notifications: "Grade released: Lab report 1" and "New announcement: Lab report 1 marking update" marked "Unread", and "New announcement: Reading list posted" and "New announcement: Welcome to BIO101" without the marker; "New announcement: Welcome to BIO101" is last.
- Given I click "Grade released: Lab report 1", When the page loads, Then I land on the Lab report 1 assignment page and the bell count is 1.
- Given I click "Mark all as read", When the list updates, Then the bell shows no count and all four notifications remain in the list as read.

### US-18 Choose which notifications I get

**As a** student **I want** to switch notification types on or off **so that** I control how much attention the system asks for.

**Priority:** P1

**Evidence:** pain-points.md#Worth copying; moodle.md#Worth copying; canvas.md#Pain points (2)

**Acceptance criteria:**
- Given I am signed in as Maya, When I open Settings then Notifications, Then I see switches for New announcement, New assignment, Due date changed, Grade released and Replies to me, all on, and the text "Notifications appear in Scientia only. No email is sent."
- Given I switch off New announcement and reload, When the page loads, Then the switch is still off.
- Given Maya has switched off New announcement, When Ingrid posts the BIO101 announcement "Field trip", Then Maya has no notification titled "New announcement: Field trip" but can still read it in BIO101 Announcements, and Liam has one.

### US-19 Edit my profile and password

**As a** student **I want** to change my display name and password **so that** my account stays correct and secure.

**Priority:** P1

**Evidence:** blackboard.md#Pain points (7); enabler (account basics)

**Acceptance criteria:**
- Given I am signed in as Maya, When I open Settings then Profile, Then my email maya.okafor@scientia.test is shown and cannot be edited.
- Given I change my display name to "Maya O. Okafor" and save, When I look at the top bar and at my reply in the BIO101 thread "Question about the lab report", Then the new name appears in both.
- Given I enter the wrong current password, When I try to change my password, Then I see "Current password is incorrect" and I can still sign in with Demo-pass-123.
- Given I enter the correct current password and the new password "Maya-new-pass-1", When I save and sign in again with it, Then I reach the dashboard.
- Given I enter a new password of 7 characters, When I save, Then I see "Password must be at least 8 characters".

### US-20 Use the keyboard and a screen reader

**As a** student using a keyboard or screen reader **I want** every page to follow basic accessibility rules **so that** I can do all of this without a mouse.

**Priority:** P0

**Evidence:** pain-points.md#Pain points (11); blackboard.md#Pain points (13); brightspace-itslearning.md#Pain points (7)

**Acceptance criteria:**
- Given each of these pages has loaded: sign-in, Maya's dashboard, BIO101 course home, the Photosynthesis worksheet page, the BIO101 Gradebook (as Ingrid), Admin Users (as Alex), When I press Tab once, Then the first focus is a "Skip to main content" link and activating it moves focus into the main region.
- Given Maya's dashboard, BIO101 course home and the Photosynthesis worksheet page, When I read the page structure, Then each has exactly one `banner`, exactly one `main`, exactly one `h1`, and every `navigation` landmark has a unique `aria-label`.
- Given I submit the sign-in form with an empty email, When the error appears, Then it reads "Enter your email", has `role="alert"`, is linked to the field with `aria-describedby`, and focus moves to the Email field.
- Given I tab through the Photosynthesis worksheet page, When each control receives focus, Then it has a visible focus outline and every interactive target is at least 24 by 24 CSS pixels.
- Given the end-to-end suite has run, When I read `e2e/.results/a11y.jsonl` (summarised by `mise run metrics`), Then no entry has a violation of impact serious or critical. The automatic axe scan in `e2e/fixtures.ts` runs on the last page of every test, so the tests of US-14, 15, 23, 27, 30 and 32 cover the calendar, a discussion thread, Modules, the New assignment form, the grading view and the gradebook, signed in as Maya or as Ingrid.

### US-21 Use Scientia on a phone

**As a** student **I want** the website to work on a phone screen **so that** I can check deadlines and submit work without an app.

**Priority:** P1

**Evidence:** pain-points.md#Pain points (2, mobile to-do gaps; teacher mobile gap, line 64); canvas.md#Pain points (4); blackboard.md#Features by area (Mobile)

**Acceptance criteria:**
- Given a 390 by 844 pixel viewport, When I open the dashboard, the BIO101 course home and the Photosynthesis worksheet page as Maya, Then none of them has horizontal scroll (`scrollWidth` equals `clientWidth`).
- Given the same viewport, When I look at the course navigation, Then it is collapsed behind a "Course pages" button that opens the same seven items, reachable by keyboard.
- Given the same viewport, When I open the Photosynthesis worksheet page as Maya, Then the text field and the Submit button are fully visible without horizontal scrolling; and when Ingrid opens the grading view of Sofia's Lab report 1, the Score field, the Feedback field and the Save draft button are fully visible.
- Given the same viewport, When I open the dashboard as Maya, Then Upcoming lists the same four items in the same order as on a desktop viewport.
- Given a 320 pixel wide viewport, When I open the BIO101 Assignments list, Then the page has no horizontal scroll, no text element is clipped, and the computed font size of body text is at least 16px.
