# Teacher stories

Demo data, time rules and test conventions are in `README.md`. Ids continue from `student.md`.

### US-22 Start from a dashboard of my courses

**As a** teacher **I want** my courses and the amount of work waiting for me on the first screen **so that** I can start grading in one click.

**Priority:** P0

**Evidence:** blackboard.md#Worth copying; blackboard.md#Pain points (1)

**Acceptance criteria:**
- Given I sign in as ingrid.solberg@scientia.test, When I land, Then I see course cards for BIO101 (4 students, "2 need grading") and HIS201 (2 students, "0 need grading").
- Given I am on the dashboard, When I click "2 need grading" on BIO101, Then I land on the BIO101 Grading page filtered to Needs grading, one click from the dashboard.
- Given I click the HIS201 card title, When the course opens, Then its navigation lists, in order, Home, Modules, Assignments, Announcements, Discussions, Grading, Gradebook, People.

### US-23 Create modules and decide when students see them

**As a** teacher **I want** to create modules and publish them when ready **so that** students never see unfinished material.

**Priority:** P0

**Evidence:** blackboard.md#Pain points (3); canvas.md#Worth copying

**Acceptance criteria:**
- Given I open BIO101 Modules as Ingrid, When the page loads, Then I see "Week 1: Cells", "Week 2: Photosynthesis" and "Week 3: Genetics" with a "Draft" badge on Week 3 only.
- Given I click Add module, enter "Week 4: Ecology" and save, When the page updates, Then the module appears last with a "Draft" badge.
- Given Week 3 is a draft and "Week 4: Ecology" has been created as above, When Maya opens BIO101 Modules, Then neither Week 3 nor Week 4 is visible to her.
- Given I click Publish on Week 3, When Maya reloads Modules, Then Week 3 and its page "Mendel and peas" are visible; after I click Unpublish and she reloads, they are hidden again.
- Given I leave the module name empty, When I save, Then I see the error "Enter a module name" linked to the name field and no module is created.

### US-24 Add pages, files and links to a module

**As a** teacher **I want** to add a page, a file or a link to a module in a few steps **so that** students get course material in a predictable place.

**Priority:** P0

**Evidence:** blackboard.md#Pain points (1); canvas.md#Features by area (Courses & content)

**Acceptance criteria:**
- Given the module "Week 4: Ecology" exists (created as in US-23), When I choose Add page, enter title "Ecology intro" and the body `Food **webs** link producers to consumers:` followed by the lines `- Producers` and `- Consumers`, and save, Then the page appears in the module and, when opened, shows "webs" in bold (`strong`) and a bulleted list of two items.
- Given I choose Add file and upload `sample.pdf`, When it finishes, Then the item shows the file name `sample.pdf`, and once I publish Week 4 Maya can download `sample.pdf`.
- Given I choose Add link and enter title "Food webs" and URL `not a url`, When I save, Then I see the error "Enter a web address starting with http:// or https://" linked to the URL field; with `https://example.org/food-webs` it saves.
- Given I added a page, then a file, then a link, When I view the module, Then they are listed in that order.
- Given I click Delete on an item, When I confirm in the dialog, Then it disappears from the module for me and for students.

### US-25 Post an announcement

**As a** teacher **I want** to post an announcement to a course in one short form **so that** every student sees it.

**Priority:** P0

**Evidence:** pain-points.md#Pain points (7); canvas.md#Features by area (Announcements)

**Acceptance criteria:**
- Given I open BIO101 Announcements, When I click New announcement, enter title "Field trip" and the message "Meet at the main gate at 09:00.", and click Post, Then the list shows "Welcome to BIO101" (pinned) first, then "Field trip" with the author "Dr. Ingrid Solberg" and today's date, then "Lab report 1 marking update".
- Given I post it, When Maya opens BIO101 Announcements, Then "Field trip" is listed and marked "Unread".
- Given I leave the title empty, When I click Post, Then I see the error "Enter a title" linked to the title field and nothing is posted.
- Given I have posted "Field trip" in BIO101, When I open HIS201 Announcements, Then only "Reading list posted" is listed.

### US-26 Pin, edit and delete announcements

**As a** teacher **I want** to pin the announcement that matters and correct or remove others **so that** the list stays short and accurate.

**Priority:** P1

**Evidence:** pain-points.md#Worth copying; google-classroom.md#Worth avoiding

**Acceptance criteria:**
- Given I open BIO101 Announcements, When I click Pin on "Lab report 1 marking update", Then it shows a "Pinned" label and the pinned announcements are listed in this order above any others: "Lab report 1 marking update", then "Welcome to BIO101" (pinned announcements sort newest first).
- Given it is pinned, When I click Unpin, Then the "Pinned" label disappears and it is listed below "Welcome to BIO101" again.
- Given I change the title of "Lab report 1 marking update" to "Lab report 1 marks (revised)" and save, When the list reloads, Then it shows the new title and an "Edited" label.
- Given I click Delete on "Lab report 1 marking update", When I cancel the dialog, Then nothing is deleted; when I click Delete again and confirm, Then it disappears from my list and from Maya's list.

### US-27 Create an assignment

**As a** teacher **I want** to create an assignment with a due date and points in a single form **so that** students see it at once in their lists.

**Priority:** P0

**Evidence:** moodle.md#Pain points (2, 13); canvas.md#Pain points (8)

**Acceptance criteria:**
- Given I open BIO101 Assignments and click New assignment, When the form opens, Then it has exactly these controls: Title, Instructions, Due date and time, Points, "Students hand in by" (Uploading a file, Typing an answer), "Accept work after the due date (marked late)", Save as draft, Save and publish.
- Given I fill in title "Reading quiz", due T+10d at 23:59, points 20, Typing an answer, and click Save as draft, When Maya opens Assignments, Then "Reading quiz" is not visible to her.
- Given I click Save and publish instead, When Maya opens her dashboard, Then "Reading quiz" is in Upcoming between Essay: the 1848 revolutions and Field journal, with 20 points.
- Given I leave the title empty, set points to 0, and select neither Uploading a file nor Typing an answer, When I save, Then I see "Enter a title", "Enter points greater than 0" and "Choose at least one way to submit", each linked to its field, and no assignment is created.

### US-28 Change an assignment after creating it

**As a** teacher **I want** to edit, publish and unpublish assignments **so that** I can correct mistakes without breaking student work.

**Priority:** P1

**Evidence:** blackboard.md#Pain points (10); moodle.md#Pain points (13)

**Acceptance criteria:**
- Given I open Field journal, When I change the due date to T+14d 23:59 and save, Then Maya's dashboard and Calendar show the due date T+14d 23:59.
- Given I open the draft "Final project" and click Publish, When Maya reloads her Assignments, Then it is listed.
- Given Photosynthesis worksheet has a submission from Liam, When I look for Unpublish, Then it is disabled with the text "Cannot unpublish: students have submitted".
- Given Field journal has no submissions, When I click Unpublish, Then it disappears from Maya's lists.

### US-29 Work through a grading queue

**As a** teacher **I want** one list of submissions by status **so that** I always know what needs my attention.

**Priority:** P0

**Evidence:** design-patterns.md#Features by area (Grading & feedback); google-classroom.md#Worth copying; blackboard.md#Worth copying

**Acceptance criteria:**
- Given I open BIO101 Grading, When the page loads, Then the default filter is "Needs grading" and shows exactly two rows sorted by assignment due date, earliest first: Sofia Reyes, Lab report 1 (due T-7d), with a "Late by 1 day" badge, then Liam Hansen, Photosynthesis worksheet (due T+2d).
- Given I choose the filter "Graded, not released", When the list updates, Then it shows one row: Liam Hansen, Lab report 1.
- Given I choose "Released", When the list updates, Then it shows two rows, both Maya Okafor: Safety acknowledgement and Lab report 1.
- Given I choose "Missing", When the list updates, Then it shows four rows: Noah Berg for Lab report 1, and Liam Hansen, Sofia Reyes and Noah Berg for Safety acknowledgement.
- Given I click the Needs grading row for Sofia Reyes, When the page loads, Then I land on that submission's grading view.

### US-30 Grade a submission with a score and written feedback

**As a** teacher **I want** to read a submission, enter a score and feedback, and move to the next one **so that** I can grade a class quickly.

**Priority:** P0

**Evidence:** design-patterns.md#Worth copying (Teams To return list); canvas.md#Worth copying; moodle.md#Pain points (15)

**Acceptance criteria:**
- Given I open Sofia's Lab report 1, When the grading view loads, Then I see her text "Sorry this is late. Report text: cells observed under 400x magnification.", the points possible "100", a Score field and a Feedback field.
- Given I enter 78 and the feedback "Good analysis, cite your sources", When I click Save, Then the queue shows her submission as "Graded, not released", and Sofia's own Grades page still shows "Awaiting grade" for Lab report 1.
- Given I enter 101, When I click Save, Then I see "Score must be between 0 and 100" and nothing is saved; with an empty Score I see "Enter a score" and nothing is saved.
- Given I have saved Sofia's grade, When I click "Next to grade", Then I land on Liam's Photosynthesis worksheet.
- Given I type 80 in Score on Sofia's Lab report 1 and click Grading in the course navigation, When the in-app dialog "Discard unsaved changes?" appears and I click "Stay on this page", Then the Score field still shows 80 and I am still on the grading view.

### US-31 Release grades to students

**As a** teacher **I want** to decide when students see grades, one at a time or all together **so that** nobody sees half-finished marks.

**Priority:** P0

**Evidence:** moodle.md#Worth copying (Named marking states); blackboard.md#Pain points (10); pain-points.md#Pain points (8)

**Acceptance criteria:**
- Given Liam's Lab report 1 is "Graded, not released", When I click Release on its row, Then the row moves to "Released" and Liam's Grades page shows "72 / 100" with the feedback "Good observations; the conclusion needs evidence from your data."
- Given I save a draft of 78 for Sofia's Lab report 1 and a draft of 40 for Liam's Photosynthesis worksheet (so three graded-not-released submissions exist with Liam's seeded one), When I click "Release all graded (3)", Then the dialog reads "Release 3 grades? Students will see their scores and feedback." and after I confirm, all three rows are "Released" and the button is gone.
- Given Maya's Lab report 1 is "Released", When I click Withdraw on its row and confirm, Then it returns to "Graded, not released" and Maya's Grades page shows "Awaiting grade" for it.
- Given all graded work has been released (Liam's Lab report 1 released as in the first criterion), When I open the queue, Then there is no "Release all graded" button.

### US-32 See every student's grades in a gradebook

**As a** teacher **I want** a grid of students by assignment with clear states **so that** I can check the whole class at a glance and trust the numbers.

**Priority:** P0

**Evidence:** blackboard.md#Pain points (2); moodle.md#Pain points (7, 8); canvas.md#Pain points (3)

**Acceptance criteria:**
- Given I open BIO101 Gradebook, When it loads, Then rows, sorted by last name ascending, are Noah Berg, Liam Hansen, Maya Okafor, Sofia Reyes, and columns are Safety acknowledgement (10), Lab report 1 (100), Photosynthesis worksheet (50), Field journal (100), then Total.
- Given the seed data, When I read the cells, Then Maya shows 10 and 86, Liam's Lab report 1 shows 72 with a "Not released" tag, Sofia's Lab report 1 shows "Late, needs grading", and Noah's Lab report 1 shows "Missing".
- Given the totals (the teacher view includes draft grades), When I read them, Then Maya shows 87.3%, Liam shows 72.0%, and Sofia and Noah show "–"; no Missing cell is counted as zero.
- Given the grid, When I look below it, Then a legend explains "Not released", Released, Missing, Late and "Needs grading".
- Given I click Liam's Lab report 1 cell, When the page loads, Then I land on his grading view.

### US-33 Export the gradebook as CSV

**As a** teacher **I want** to download grades as a CSV file **so that** I can keep records or use them in another tool.

**Priority:** P1

**Evidence:** brightspace-itslearning.md#Worth copying; google-classroom.md#Features by area (Gradebook)

**Acceptance criteria:**
- Given I am on BIO101 Gradebook, When I click Export CSV, Then the Playwright download event fires with the file name `bio101-gradebook.csv`.
- Given I read the downloaded file, When I read the header row, Then it is `Last name,First name,Email,Safety acknowledgement (10),Lab report 1 (100),Photosynthesis worksheet (50),Field journal (100),Total %`.
- Given the seed data, When I read the data rows, Then there are four, in the order Berg, Hansen, Okafor, Reyes, and Maya's row is `Okafor,Maya,maya.okafor@scientia.test,10,86,,,87.3` and Liam's is `Hansen,Liam,liam.hansen@scientia.test,,72,,,72.0`.
- Given I am signed in as Maya, When I look at every BIO101 page I can open, Then there is no Export CSV button; and when I request `/rest/v1/grades`, Then the response has exactly two rows, both with her student id and `released` true, and the body does not contain "Good observations" (Liam's unreleased feedback).

### US-34 See the course roster

**As a** teacher **I want** to see who is in my course **so that** I know who should be submitting work.

**Priority:** P0

**Evidence:** pain-points.md#Features by area (Roles & admin); canvas.md#Features by area (Roles & admin); enabler (no pain point)

**Acceptance criteria:**
- Given I open BIO101 People as Ingrid, When the page loads, Then I see "4 students" with each student's name and email, sorted by last name (Noah Berg, Liam Hansen, Maya Okafor, Sofia Reyes), and Dr. Ingrid Solberg listed as teacher.
- Given I open HIS201 People, When the page loads, Then I see "2 students": Liam Hansen and Maya Okafor.

### US-35 Enrol an existing user by email

**As a** teacher **I want** to add a student who already has an account by typing their email **so that** enrolment takes seconds.

**Priority:** P0

**Evidence:** pain-points.md#Features by area (Roles & admin); moodle.md#Worth avoiding (Exposing the full role system); enabler (no pain point)

**Acceptance criteria:**
- Given I open BIO101 People and click Add student, When I enter PRIYA.NAIR@scientia.test (emails match case-insensitively) and confirm, Then Priya appears in the roster and the count reads "5 students".
- Given Priya signs in afterwards, When she opens her dashboard, Then BIO101 is listed and Photosynthesis worksheet and Field journal appear in Upcoming.
- Given I enter an email that no account uses, When I confirm, Then I see "No Scientia account uses this email. Ask an administrator to create one." and the roster is unchanged.
- Given I enter maya.okafor@scientia.test, When I confirm, Then I see "Maya Okafor is already in this course."
- Given I enter admin@scientia.test, When I confirm, Then I see "Only student accounts can be added to a course." and the roster is unchanged.

### US-36 Remove a student from a course

**As a** teacher **I want** to remove a student who should not be in my course **so that** the roster and gradebook stay accurate.

**Priority:** P1

**Evidence:** pain-points.md#Features by area (Roles & admin); enabler (no pain point)

**Acceptance criteria:**
- Given I click Remove next to Sofia Reyes in BIO101 People, When I confirm the dialog, Then she disappears from the roster, the Gradebook and the Grading queue.
- Given Sofia has been removed, When she signs in and opens the recorded BIO101 course home URL, Then the page heading is "You don't have access to this course" and BIO101 is not on her dashboard.
- Given I add Sofia back by email, When I open the Gradebook, Then her Lab report 1 cell shows "Late, needs grading" again.

### US-37 Moderate discussions

**As a** teacher **I want** to remove an inappropriate post **so that** the discussion stays useful and civil.

**Priority:** P1

**Evidence:** none in the research; enabler for the Discussions row of the synthesis feature matrix (Scientia decision: threads with teacher delete)

**Acceptance criteria:**
- Given I open the thread "Question about the lab report" as Ingrid, When I click Delete on Maya's reply and confirm, Then the reply is replaced by "This post was removed by a teacher" for everyone, including Liam.
- Given I am signed in as Maya, When I view Liam's post, Then there is no Delete button on it.
- Given I delete the whole thread "Question about the lab report" and confirm, When I return to the list, Then the thread and its replies are gone.
