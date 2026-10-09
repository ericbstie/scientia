# Admin stories

Demo data and conventions are in `README.md`. Ids continue from `teacher.md`.

### US-38 Find and review user accounts

**As an** admin **I want** a list of all accounts with search **so that** I can answer account questions quickly.

**Priority:** P0

**Evidence:** pain-points.md#Features by area (Roles & admin); moodle.md#Worth avoiding (Exposing the full role system)

**Acceptance criteria:**
- Given I sign in as admin@scientia.test, When I land, Then I see the Admin area with a Users table of seven accounts showing name, email, role and status.
- Given I type "okafor" in the search box, When the table updates, Then only Maya Okafor is listed.
- Given I choose the role filter "teacher", When the table updates, Then only Dr. Ingrid Solberg is listed.

### US-39 Create a user account

**As an** admin **I want** to create an account with a name, email, role and starting password **so that** someone can start using Scientia today.

**Priority:** P0

**Evidence:** pain-points.md#Features by area (Roles & admin); brightspace-itslearning.md#Pain points (11)

**Acceptance criteria:**
- Given I click New user, When I enter name "Eva Lund", email eva.lund@scientia.test, role student and password "Start-pass-1" and save, Then Eva appears in the Users table as an active student.
- Given Eva signs in with that password, When she lands, Then she sees an empty dashboard saying she is not enrolled in any course.
- Given I enter an email already in use, When I save, Then I see "An account with this email already exists" and nothing is created.
- Given I enter an invalid email or a password shorter than 8 characters, When I save, Then I see an error for each invalid field.

### US-40 Deactivate and reactivate a user

**As an** admin **I want** to switch an account off and on **so that** people who leave cannot sign in but their work is kept.

**Priority:** P1

**Evidence:** brightspace-itslearning.md#Pain points (11); pain-points.md#Features by area (Roles & admin)

**Acceptance criteria:**
- Given I click Deactivate on Priya Nair and confirm, When the table updates, Then her status reads "Deactivated".
- Given Priya is deactivated, When she tries to sign in, Then she sees "This account is deactivated. Contact your administrator." and stays signed out.
- Given I click Reactivate on Priya, When she signs in again, Then she reaches her dashboard.
- Given I open my own row, When I look for Deactivate, Then it is disabled.

### US-41 Reset a user's password

**As an** admin **I want** to set a new password for someone who is locked out **so that** they can get back in without email.

**Priority:** P1

**Evidence:** blackboard.md#Pain points (7); brightspace-itslearning.md#Pain points (11)

**Acceptance criteria:**
- Given I click Reset password on Liam Hansen and enter "Reset-pass-9", When I save, Then I see a confirmation.
- Given the reset is saved, When Liam signs in with Demo-pass-123, Then he sees "Email or password is incorrect".
- Given the reset is saved, When Liam signs in with Reset-pass-9, Then he reaches his dashboard.
- Given I enter a password shorter than 8 characters, When I save, Then I see an error and the password is unchanged.

### US-42 Create a course and assign its teacher

**As an** admin **I want** to create a course with a code, a title and a teacher **so that** the teacher can start building it immediately.

**Priority:** P0

**Evidence:** pain-points.md#Features by area (Roles & admin); design-patterns.md#Features by area (Empty states & onboarding)

**Acceptance criteria:**
- Given I open Admin then Courses and click New course, When I enter code CHE110, title "General Chemistry", pick Dr. Ingrid Solberg and save, Then CHE110 appears in the Courses table.
- Given Ingrid signs in, When she opens her dashboard, Then CHE110 is listed with "0 students" and opens with the standard course navigation.
- Given the new course has no content, When Ingrid opens CHE110 Modules, Then she sees "No modules yet" and an Add module button, and when she opens Assignments she sees "No assignments yet" and a New assignment button.
- Given I enter a code that already exists, When I save, Then I see an error "A course with this code already exists".
- Given I leave the teacher unselected, When I save, Then I see an error and no course is created.

### US-43 Keep admin and teacher tools away from other roles

**As an** admin **I want** pages and data restricted by role **so that** students cannot see or change what is not theirs.

**Priority:** P0

**Evidence:** blackboard.md#Pain points (10); pain-points.md#Pain points (8)

**Acceptance criteria:**
- Given I am signed in as Maya, When I open the Admin URL, Then I see a "You don't have access" page and the top bar has no Admin link.
- Given I am signed in as Ingrid, When I open the Admin URL, Then I see the same page.
- Given I am signed in as Maya, When I open the BIO101 Gradebook or Grading URL, Then I see "You don't have access" and no grade data.
- Given I am signed in as Maya, When I request the user list API endpoint, Then the response status is 403 and the body contains no user data.
