# Admin stories

Demo data, time rules and test conventions are in `README.md`. Ids continue from `teacher.md`.

### US-38 Find and review user accounts

**As an** admin **I want** a list of all accounts with search **so that** I can answer account questions quickly.

**Priority:** P0

**Evidence:** pain-points.md#Features by area (Roles & admin); moodle.md#Worth avoiding (Exposing the full role system); enabler (no pain point)

**Acceptance criteria:**
- Given I sign in as admin@scientia.test, When I land, Then I see the Admin area with a Users table of seven accounts showing name, email, role and status; every status is "Active", Alex Admin's role is "admin", Dr. Ingrid Solberg's is "teacher" and the other five are "student".
- Given I type "okafor" in the search box, When the table updates, Then only Maya Okafor is listed.
- Given I choose the role filter "teacher", When the table updates, Then only Dr. Ingrid Solberg is listed.

### US-39 Create a user account

**As an** admin **I want** to create an account with a name, email, role and starting password **so that** someone can start using Scientia today.

**Priority:** P0

**Evidence:** pain-points.md#Features by area (Roles & admin); brightspace-itslearning.md#Pain points (11); enabler (no pain point)

**Acceptance criteria:**
- Given I click New user, When I enter name "Eva Lund", email eva.lund@scientia.test, role student and password "Start-pass-1" and save, Then I see "Eva Lund added as a student" and Eva appears in the Users table as an "Active" "student", and the table has eight rows.
- Given Eva signs in with that password, When she lands, Then she sees the text "You are not enrolled in any course yet." and no course cards.
- Given I type the password, When I look at the field, Then it is masked; ticking "Show password" reveals it so I can pass it on.
- Given I enter maya.okafor@scientia.test as the email, When I save, Then I see "An account with this email already exists" and nothing is created.
- Given I enter the email "eva.lund" and the password "short12" (7 characters), When I save, Then the email field shows "Enter a valid email address", the password field shows "Password must be at least 8 characters", and nothing is created.
- Given I created Tomas Lind as a student by mistake, When I change "Role for Tomas Lind" to teacher in his row, Then I see "Tomas Lind is now a teacher" and he is offered as a teacher when I create a course. My own role cannot be changed.

### US-40 Deactivate and reactivate a user

**As an** admin **I want** to switch an account off and on **so that** people who leave cannot sign in but their work is kept.

**Priority:** P1

**Evidence:** brightspace-itslearning.md#Pain points (11); pain-points.md#Features by area (Roles & admin); enabler (no pain point)

**Acceptance criteria:**
- Given I click Deactivate on Priya Nair and confirm, When the table updates, Then her status reads "Deactivated".
- Given Priya is deactivated, When she tries to sign in, Then she sees "This account is deactivated. Contact your administrator." and stays signed out.
- Given I click Reactivate on Priya, When she signs in again, Then she reaches her dashboard.
- Given I open my own row (Alex Admin), When I look for Deactivate, Then it is disabled.

### US-41 Reset a user's password

**As an** admin **I want** to set a new password for someone who is locked out **so that** they can get back in without email.

**Priority:** P1

**Evidence:** blackboard.md#Pain points (7); brightspace-itslearning.md#Pain points (11)

**Acceptance criteria:**
- Given I click Reset password on Liam Hansen and enter "Reset-pass-9", When I save, Then I see "Password reset for Liam Hansen".
- Given the reset is saved, When Liam signs in with Demo-pass-123, Then he sees "Email or password is incorrect".
- Given the reset is saved, When Liam signs in with Reset-pass-9, Then he reaches his dashboard.
- Given I enter the 7-character password "short12", When I save, Then I see "Password must be at least 8 characters" and Liam can still sign in with Demo-pass-123.

### US-42 Create a course and assign its teacher

**As an** admin **I want** to create a course with a code, a title and a teacher **so that** the teacher can start building it immediately.

**Priority:** P0

**Evidence:** pain-points.md#Features by area (Roles & admin); design-patterns.md#Features by area (Empty states & onboarding)

**Acceptance criteria:**
- Given I open Admin then Courses and click New course, When I enter code CHE110, title "General Chemistry", pick Dr. Ingrid Solberg and save, Then CHE110 appears in the Courses table.
- Given Ingrid signs in, When she opens her dashboard, Then CHE110 is listed with "0 students" and opens with the navigation Home, Modules, Assignments, Announcements, Discussions, Grading, Gradebook, People.
- Given the new course has no content, When Ingrid opens CHE110 Modules, Then she sees "No modules yet" and an Add module button, and when she opens Assignments she sees "No assignments yet" and a New assignment button.
- Given I enter the code BIO101, When I save, Then I see "A course with this code already exists" and no course is created.
- Given I leave the teacher unselected, When I save, Then I see "Choose a teacher" linked to the teacher field and no course is created.

### US-43 Keep admin and teacher tools away from other roles

**As an** admin **I want** pages and data restricted by role **so that** students cannot see or change what is not theirs.

**Priority:** P0

**Evidence:** none in the research; security baseline required by the three fixed roles (synthesis.md feature matrix, Roles & admin row)

**Acceptance criteria:**
- Given I recorded the Admin URL from Alex's top bar, When I open it as Maya, Then the page heading is "You don't have access" and the top bar has no Admin link.
- Given I am signed in as Ingrid, When I open the recorded Admin URL, Then I see the same page.
- Given I recorded the BIO101 Gradebook and Grading URLs as Ingrid, When I open each as Maya, Then the heading is "You don't have access" and the page text contains none of "Hansen", "Reyes", "72" or "Released".
- Given I am signed in as Maya, When I request `/rest/v1/profiles?select=email,full_name`, Then the body contains none of liam.hansen@, sofia.reyes@, noah.berg@, priya.nair@, ingrid.solberg@ or admin@; and when I POST `{"email":"x@scientia.test","password":"Start-pass-1","full_name":"X"}` to `/api/admin/users`, Then the response status is 403 and the body is `{"error":"Only administrators can create users."}`.
- Given any page of the app (for example `/`, `/sign-in` or a course's Grading page), When it is requested, Then the response carries `x-frame-options: DENY` and a content security policy with `frame-ancestors 'none'` and `script-src 'self'`, so no other site can frame it or inject scripts into it.
