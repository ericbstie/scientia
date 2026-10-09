# Information architecture and layout plan

Scope: the 43 stories in `docs/stories/` and nothing else. Visual and copy rules are in `ui-guidelines.md`. Principles come from `docs/research/synthesis.md`: one predictable course, every deadline in one list, calm notifications, trusted grades, accessible from the start.

## Layout model

Three layouts, all inside one app shell. Every screen has a URL.

1. **Auth layout** (`/sign-in`): centred card, `.auth-page` and `.auth-card`, no top bar.
2. **App layout** (everything else): the **top bar** across the full width, then `main`. Content column is `.content` (880 px), or `.content.wide` (1160 px) for the Gradebook, Grading queue and Admin tables.
3. **Course layout** (every route under `/courses/:courseId`): the top bar, then the **course navigation** on the left (248 px, the existing `.sidebar` styling, now below the top bar) and `main` on the right. The navigation is identical on every course for the role:
   - Student: Home, Modules, Assignments, Announcements, Discussions, Grades, People.
   - Teacher: Home, Modules, Assignments, Announcements, Discussions, Grading, Gradebook, People.
   - Under it, a course heading: course code and title (links to course Home).

**Top bar** (landmark `banner`, on every page except sign-in): Scientia logo (to `/`), Calendar, Notifications (bell with unread count, links to `/notifications`), Admin (admins only), then the user's name as a menu button holding Settings and Sign out. The existing `.topbar` is mobile-only; M3 makes it permanent.

Role of `/`: student sees the student dashboard, teacher the teacher dashboard, admin is redirected to `/admin/users`.

Access rules shown on every protected route (US-2, US-43): signed out goes to `/sign-in?next=<path>`; a wrong-role or non-member visit renders an in-place "You don't have access" page (course: "You don't have access to this course") with a link to the dashboard, at the same URL, with no data fetched. An unknown id or another student's record renders "Page not found" (US-13). These two pages are states, not routes.

## Site map

```
/sign-in                                                       R1  public
/                                                              R2  Dashboard (student, teacher); admin -> /admin/users
/calendar                                                      R3
/notifications                                                 R4
/settings                                                      -> redirect to /settings/profile
  /settings/profile                                            R5
  /settings/notifications                                      R6
/courses/:courseId                                             R7  Course home
  /courses/:courseId/modules                                   R8
    /courses/:courseId/modules/:moduleId/pages/new             R9   teacher
  /courses/:courseId/pages/:pageId                             R10
  /courses/:courseId/announcements                             R11
    /courses/:courseId/announcements/new                       R12  teacher
    /courses/:courseId/announcements/:announcementId           R13
    /courses/:courseId/announcements/:announcementId/edit      R14  teacher
  /courses/:courseId/discussions                               R15
    /courses/:courseId/discussions/new                         R16
    /courses/:courseId/discussions/:threadId                   R17
  /courses/:courseId/assignments                               R18
    /courses/:courseId/assignments/new                         R19  teacher
    /courses/:courseId/assignments/:assignmentId               R20
    /courses/:courseId/assignments/:assignmentId/edit          R21  teacher
  /courses/:courseId/grades                                    R22  student
  /courses/:courseId/grading                                   R23  teacher (?status=needs-grading|graded|released|missing)
    /courses/:courseId/grading/:submissionId                   R24  teacher
  /courses/:courseId/gradebook                                 R25  teacher
    /courses/:courseId/gradebook.csv                           R29  teacher, file download, no screen
  /courses/:courseId/people                                    R26
/admin                                                         -> redirect to /admin/users
  /admin/users                                                 R27  admin
  /admin/courses                                               R28  admin
```

29 routes: 28 screens and 1 CSV download. Two redirects (`/settings`, `/admin`). The Admin area has its own sub-navigation (`nav` labelled "Admin": Users, Courses).

Decisions that keep the route count low:
- A form with a textarea is a page (R9, R12, R14, R16, R19, R21). A form with one to four short fields is a dialog (Add module, Add file, Add link, Add student, New user, New course, Reset password).
- Files and links need no screen: a file item downloads, a link item opens in a new tab with `rel="noopener"`.
- Assignment R20 is one URL with two renderings: student (instructions plus submission) and teacher (instructions plus publish controls).
- There is no separate student submission URL; a student's work is part of R20. Opening `/grading/:submissionId` as a student gives "Page not found", while the queue URL `/grading` gives "You don't have access" (US-13 versus US-43).

## Routes

### R1 `/sign-in`
- **Purpose:** authenticate; return to `next` if set.
- **Who:** signed-out visitors. A signed-in visitor is sent to `/`.
- **Regions:** `main` with one card: h1 "Sign in to Scientia"; Email; Password; error alert; Sign in. Demo build only: a list of the demo accounts and their shared password; the server reports `demo` in `/config.json` from `SEED_DEMO`, and the list is removed when `SEED_DEMO=false`.
- **Primary action:** Sign in (Enter submits).
- **Empty state:** none. Error: "Email or password is incorrect" (one message). Deactivated: "This account is deactivated. Contact your administrator."
- **Stories:** US-1, US-2, US-40, US-41.

### R2 `/` Dashboard
- **Purpose:** answer "what is due" and open a course.
- **Who:** student and teacher (admin is redirected).
- **Student regions:** h1 "Dashboard"; 1. Upcoming (list rows, soonest first, drafts and past-due excluded; each row: title, course code, due date, points, status badge); 2. Missing (list rows: Lab report 1 with "Submit late" link, or Safety acknowledgement with "Closed" badge; "Nothing missing" when none); 3. Your courses (course cards: code, title).
- **Teacher regions:** h1 "Dashboard"; Your courses as cards: code, title (link to R7), "N students", "N need grading" (link to `/grading?status=needs-grading`).
- **Primary action:** none. The whole page is links; the first useful row is the first tab stop after the skip link and top bar.
- **Empty state:** student with no courses: "You are not enrolled in any course yet. Your teacher can add you by email, or ask an administrator." Upcoming empty: "Nothing due. New assignments appear here when your teacher publishes them." Teacher with no courses: "You don't teach any course yet. An administrator creates courses and assigns teachers."
- **Stories:** US-3, US-4, US-5, US-9, US-22, US-39 (empty), US-42.

### R3 `/calendar`
- **Purpose:** plan by month.
- **Who:** student, teacher (published assignments of their courses); admin sees an empty month.
- **Regions:** h1 "Calendar"; month controls (Previous month, Today, Next month) with h2 month name; month grid (table, day numbers, items as links "BIO101 Field journal"); today marked with text "Today" in its `aria-label` and a visible outline. Under 820 px the grid becomes a day-by-day list of days that have items.
- **Primary action:** none (navigation controls are secondary).
- **Empty state:** "Nothing is due this month."
- **Stories:** US-14.

### R4 `/notifications`
- **Purpose:** catch up, newest first.
- **Who:** all roles.
- **Regions:** h1 "Notifications"; Mark all as read button (hidden when none unread); list rows (text link to the target, time, "Unread" label on unread ones).
- **Primary action:** open a notification.
- **Empty state:** "You have no notifications."
- **Stories:** US-16, US-17.

### R5 `/settings/profile`
- **Purpose:** change display name and password.
- **Who:** all roles.
- **Regions:** h1 "Settings"; sub-navigation "Settings" (Profile, Notifications); section Profile (Email read-only, Display name, Save name); section Password (Current password, New password with hint "At least 8 characters", Change password).
- **Primary action:** Save name.
- **Empty state:** none.
- **Stories:** US-19.

### R6 `/settings/notifications`
- **Purpose:** switch notification types on or off.
- **Who:** all roles (teachers see the same five; no extra types).
- **Regions:** h1 "Settings"; sub-navigation; note "Notifications appear in Scientia only. No email is sent."; five checkboxes (New announcement, New assignment, Due date changed, Grade released, Replies to me) that save on change with a "Saved" toast.
- **Primary action:** none (saves on change).
- **Empty state:** none.
- **Stories:** US-18.

### R7 `/courses/:courseId` Course home
- **Purpose:** the course's start page.
- **Who:** members; teacher of the course.
- **Student regions:** eyebrow with course code; h1 course title; Announcements (up to three, pinned first then newest, with Pinned and Unread labels, and an "All announcements" link); Next due (next two published assignments with due date and status); nothing else.
- **Teacher regions:** h1 course title; "N need grading" link row to the queue; Announcements (latest three, plus New announcement button); Assignments (next three by due date, plus New assignment button).
- **Primary action:** none on the student page; on the teacher page the two section buttons are secondary.
- **Empty state:** no announcements: section omitted. No upcoming: "Nothing due in this course."
- **Stories:** US-5, US-22, US-25, US-27, US-42.

### R8 `/courses/:courseId/modules`
- **Purpose:** all material in module order.
- **Who:** student sees published modules only; teacher sees all with "Draft" badges.
- **Regions:** h1 "Modules"; Add module (teacher, opens a dialog with Name); one `section` per module: h2 name, Draft badge, Publish or Unpublish (teacher), buttons Add page, Add file, Add link (teacher, Add page links to R9), item list (type label Page, File or Link, title, Delete for teacher).
- **Primary action:** Add module (teacher); none for students.
- **Empty state:** teacher "No modules yet" with Add module button; student "No material yet. Your teacher has not published any modules."; module with no items: "This module is empty." (teacher adds "Add a page, file or link.").
- **Stories:** US-6, US-23, US-24.

### R9 `/courses/:courseId/modules/:moduleId/pages/new`
- **Purpose:** write a page for a module.
- **Who:** teacher.
- **Regions:** eyebrow "Modules › Week 4: Ecology"; h1 "Add page"; Title; Body (formatting toolbar: Bold, Bulleted list, with text labels); Save page, Cancel.
- **Primary action:** Save page.
- **Empty state:** none.
- **Stories:** US-24.

### R10 `/courses/:courseId/pages/:pageId`
- **Purpose:** read a page.
- **Who:** student if its module is published; teacher always.
- **Regions:** eyebrow link "‹ Modules"; h1 title; body (`.prose` with bold and list).
- **Primary action:** none.
- **Empty state:** none (a draft page opened by a student is "Page not found").
- **Stories:** US-6, US-23, US-24.

### R11 `/courses/:courseId/announcements`
- **Purpose:** ordered announcement list, pinned first, then newest.
- **Who:** members. Teacher also manages.
- **Regions:** h1 "Announcements"; New announcement (teacher); list rows: title, author, date, "Pinned" and "Unread" and "Edited" labels; teacher row buttons Pin or Unpin, Edit (to R14), Delete (confirm dialog).
- **Primary action:** New announcement (teacher).
- **Empty state:** "No announcements yet." Teacher adds the New announcement button.
- **Stories:** US-7, US-25, US-26.

### R12 `/courses/:courseId/announcements/new`
- **Purpose:** post one announcement.
- **Who:** teacher.
- **Regions:** eyebrow "Announcements"; h1 "New announcement"; Title; Message; Post, Cancel. Posting returns to R11 with the item at the top.
- **Primary action:** Post.
- **Empty state:** none.
- **Stories:** US-25.

### R13 `/courses/:courseId/announcements/:announcementId`
- **Purpose:** read one announcement and mark it read.
- **Who:** members.
- **Regions:** eyebrow link "‹ Announcements"; h1 title; author, date, "Pinned" and "Edited" labels; body. No reply box.
- **Primary action:** none.
- **Empty state:** none.
- **Stories:** US-7, US-16, US-17.

### R14 `/courses/:courseId/announcements/:announcementId/edit`
- **Purpose:** correct an announcement (edits never notify).
- **Who:** teacher.
- **Regions:** eyebrow; h1 "Edit announcement"; Title; Message; Save, Cancel.
- **Primary action:** Save.
- **Empty state:** none.
- **Stories:** US-26.

### R15 `/courses/:courseId/discussions`
- **Purpose:** list threads.
- **Who:** members.
- **Regions:** h1 "Discussions"; New thread; list rows: title, "by Liam Hansen", "2 replies", last activity.
- **Primary action:** New thread.
- **Empty state:** "No threads yet. Start the first one."
- **Stories:** US-15, US-37.

### R16 `/courses/:courseId/discussions/new`
- **Purpose:** start a thread.
- **Who:** members.
- **Regions:** eyebrow "Discussions"; h1 "New thread"; Title; Message; Post, Cancel. On success the thread is first in R15.
- **Primary action:** Post.
- **Empty state:** none.
- **Stories:** US-15.

### R17 `/courses/:courseId/discussions/:threadId`
- **Purpose:** read and answer a thread.
- **Who:** members; teacher moderates.
- **Regions:** eyebrow link "‹ Discussions"; h1 thread title (teacher: Delete thread); posts in time order (author, "Teacher" label, time, text; teacher Delete on each post; removed post shows "This post was removed by a teacher"); Reply (TextArea, Reply button).
- **Primary action:** Reply.
- **Empty state:** none (the thread has at least its first post).
- **Stories:** US-15, US-16, US-37.

### R18 `/courses/:courseId/assignments`
- **Purpose:** all published assignments of the course.
- **Who:** student (published only, with status badges); teacher (all, with "Draft" badge).
- **Regions:** h1 "Assignments"; New assignment (teacher); list rows soonest due first: title, due date, points, status badge (student) or Draft badge (teacher).
- **Primary action:** New assignment (teacher); none for students.
- **Empty state:** teacher "No assignments yet" with New assignment button; student "No assignments yet."
- **Stories:** US-8, US-27, US-28.

### R19 `/courses/:courseId/assignments/new`
- **Purpose:** create an assignment in one form.
- **Who:** teacher.
- **Regions:** eyebrow "Assignments"; h1 "New assignment"; Title; Instructions; Due date and time; Points; Accepts (checkboxes File upload, Text entry); Allow late submissions; Save and publish (primary), Save as draft, Cancel. Nothing else.
- **Primary action:** Save and publish.
- **Empty state:** none.
- **Stories:** US-27, US-28.

### R20 `/courses/:courseId/assignments/:assignmentId`
- **Purpose:** student: know what to do and hand in work, then see status and feedback. Teacher: review the definition and publish state.
- **Who:** student of the course; teacher of the course.
- **Student regions:** eyebrow link "‹ Assignments"; h1 title with status badge; facts (Due date, Points, Accepts, "Past due" when relevant); Instructions; Your submission: the form (text area and/or file input, shown only for accepted types, Submit) or the submitted state (time, "Submitted 1 day late", Attempt label, text, file link, Edit submission while ungraded, "Your teacher has started grading this work" once graded); Closed message "Closed: this assignment stopped accepting work on <date>" with no form; Feedback (score "86 / 100" and feedback text) after release.
- **Teacher regions:** eyebrow; h1 title with Draft badge; facts; Instructions; action row: Edit (to R21), Publish or Unpublish (disabled with the text "Cannot unpublish: students have submitted"), link "Open grading queue".
- **Primary action:** Submit (student); Publish on a draft (teacher), otherwise none.
- **Empty state:** none.
- **Stories:** US-3, US-4, US-8, US-9, US-10, US-11, US-13, US-14, US-17, US-28.

### R21 `/courses/:courseId/assignments/:assignmentId/edit`
- **Purpose:** change an assignment.
- **Who:** teacher.
- **Regions:** the R19 form prefilled; Save, Cancel.
- **Primary action:** Save.
- **Empty state:** none.
- **Stories:** US-28.

### R22 `/courses/:courseId/grades`
- **Purpose:** a student's released grades.
- **Who:** student.
- **Regions:** h1 "Grades"; total line "87.3% (96 of 110 points graded so far)"; table (Assignment link, Status, Score): released "86 / 100", otherwise "Not submitted", "Missing" or "Awaiting grade", never 0.
- **Primary action:** none.
- **Empty state:** "No assignments yet, so there are no grades."
- **Stories:** US-12, US-13.

### R23 `/courses/:courseId/grading`
- **Purpose:** the teacher's queue.
- **Who:** teacher.
- **Regions:** h1 "Grading"; Release all graded to students (N) button, shown only when N is above 0; filter links with counts (Needs grading, Graded not released, Released, Missing) as a `nav` labelled "Filter"; list rows: student, assignment, submitted time, badges ("Late by 1 day"), row action (Release, Withdraw) and the row links to R24. Missing rows have no link.
- **Primary action:** Release all graded to students (N) when shown; otherwise opening the first row.
- **Empty state:** Needs grading "Nothing needs grading."; Graded not released "No unreleased grades."; Released "No grades released yet."; Missing "No missing work."
- **Stories:** US-22, US-29, US-31, US-36, US-43.

### R24 `/courses/:courseId/grading/:submissionId`
- **Purpose:** grade one submission and move on.
- **Who:** teacher.
- **Regions:** eyebrow link "‹ Grading"; h1 "Sofia Reyes: Lab report 1", state badge in the subtitle; Submission (text, file link, submitted time, Late label); Grade form (Score with "out of 100", Feedback); Save draft, Next to grade, Release (when drafted).
- **Primary action:** Save (Release is separate).
- **Empty state:** "Next to grade" disabled with "Nothing else needs grading" when the queue is empty.
- **Stories:** US-29, US-30, US-31, US-32.

### R25 `/courses/:courseId/gradebook`
- **Purpose:** whole-class grid.
- **Who:** teacher.
- **Regions:** h1 "Gradebook"; Export CSV (secondary); table in `.table-wrap`: rows are students sorted by last name, columns assignments (title and points) then Total; first column sticky; cells show score plus a text tag ("Not released", Released), "Late, needs grading", "Needs grading", "Missing"; each graded or submitted cell links to R24; legend below ("Not released", Released, Missing, Late, "Needs grading").
- **Primary action:** none.
- **Empty state:** "No students yet. Add students on the People page."
- **Stories:** US-32, US-33, US-36, US-43.

### R26 `/courses/:courseId/people`
- **Purpose:** roster and enrolment.
- **Who:** members see names and roles; teacher also sees emails and manages.
- **Regions:** h1 "People"; Add student (teacher, dialog with Email); Teachers (list); Students heading with count "4 students" (list sorted by last name; teacher: email, Remove button with confirm dialog).
- **Primary action:** Add student (teacher).
- **Empty state:** "No students yet." (teacher adds Add student).
- **Stories:** US-5, US-34, US-35, US-36.

### R27 `/admin/users`
- **Purpose:** find and manage accounts.
- **Who:** admin.
- **Regions:** h1 "Users"; sub-navigation "Admin" (Users, Courses); New user (dialog: Name, Email, Role, Password); filters (Search, Role); table (Name, Email, Role, Status "Active" or "Deactivated", row actions Reset password, Deactivate or Reactivate; own row Deactivate disabled with the text "You can't deactivate yourself").
- **Primary action:** New user.
- **Empty state:** "No users match your search."
- **Stories:** US-38, US-39, US-40, US-41, US-43.

### R28 `/admin/courses`
- **Purpose:** create courses.
- **Who:** admin.
- **Regions:** h1 "Courses"; sub-navigation; New course (dialog: Code, Title, Teacher select); table (Code, Title, Teacher, Students).
- **Primary action:** New course.
- **Empty state:** "No courses yet" with New course button.
- **Stories:** US-42, US-43.

### R29 `/courses/:courseId/gradebook.csv`
- **Purpose:** download `<code>-gradebook.csv`, linked from R25 Export CSV.
- **Who:** teacher of the course; others get an access-denied response (403) and no file.
- **Regions:** none.
- **Primary action:** n/a.
- **Empty state:** n/a (header row only when no students).
- **Stories:** US-33.

## Story coverage

Shorthand: `C` = `/courses/:courseId`. R-numbers refer to the Routes section. "Path" is the shortest sequence of clicks from the first screen.

| Story | Route(s) | User's path |
|---|---|---|
| US-1 | R1 `/sign-in` | Open site → redirected to Sign in → Email, Password, Enter → Dashboard (or the `next` page) |
| US-2 | R1; guard on every route | Dashboard → name menu → Sign out → Sign in; direct URL when signed out → Sign in; Noah on HIS201 → "You don't have access to this course" |
| US-3 | R2 `/` | Dashboard → Upcoming list → row → Assignment |
| US-4 | R2, R20 | Dashboard → Missing → "Submit late" → Assignment with form |
| US-5 | R2, R7 `C`, R26 `C/people` | Dashboard → course card → Course home → People |
| US-6 | R8 `C/modules`, R10 `C/pages/:pageId` | Dashboard → course card → Modules → page, file or link item |
| US-7 | R11 `C/announcements`, R13 | Course nav Announcements → list → announcement |
| US-8 | R18 `C/assignments`, R20 | Course nav Assignments → row → Assignment |
| US-9 | R20 `C/assignments/:assignmentId` | Dashboard → Upcoming row → type or attach → Submit |
| US-10 | R20 | Dashboard → Upcoming row → Edit submission → Submit |
| US-11 | R20 | Dashboard → Missing "Submit late" → Submit (late), or Assignments → Closed assignment (no form) |
| US-12 | R22 `C/grades` | Course nav Grades |
| US-13 | R20, R22; 404 state | Bell → "Grade released" notification → Assignment feedback; or Grades → row → Assignment |
| US-14 | R3 `/calendar` | Top bar Calendar → item → Assignment |
| US-15 | R15 `C/discussions`, R16 `C/discussions/new`, R17 | Course nav Discussions → thread → Reply; or New thread → Post |
| US-16 | R4 `/notifications` (and bell count in top bar) | Event happens → bell count changes → Notifications (no extra screen) |
| US-17 | R4 `/notifications`; target of each item | Top bar bell → notification → target page; Mark all as read |
| US-18 | R6 `/settings/notifications` | Name menu → Settings → Notifications |
| US-19 | R5 `/settings/profile` | Name menu → Settings (opens Profile) |
| US-20 | App shell on all routes | Tab → "Skip to main content" → main (see Keyboard & screen reader) |
| US-21 | App shell on all routes | Same paths with the "Course pages" button for the course navigation (see Responsive) |
| US-22 | R2 (teacher), R23 `C/grading`, R7 | Dashboard → "2 need grading" → Grading queue; or course title → Course home |
| US-23 | R8 `C/modules` | Dashboard → course card → Modules → Add module, Publish, Unpublish |
| US-24 | R8, R9 `C/modules/:moduleId/pages/new`, R10 | Modules → module → Add page / Add file / Add link → Save; Delete → confirm |
| US-25 | R12 `C/announcements/new`, R11 | Dashboard → course card → New announcement → Post |
| US-26 | R11 `C/announcements`, R14 `C/announcements/:announcementId/edit` | Announcements → row Pin, Edit or Delete |
| US-27 | R19 `C/assignments/new` | Dashboard → course card → New assignment → Save and publish (or Save as draft) |
| US-28 | R20 (teacher), R21 `C/assignments/:assignmentId/edit` | Assignments → row → Edit, Publish or Unpublish |
| US-29 | R23 `C/grading` | Dashboard → "2 need grading" → queue → filter links |
| US-30 | R24 `C/grading/:submissionId` | Queue → row → Score, Feedback → Save → Next to grade |
| US-31 | R23, R24 | Dashboard → "2 need grading" → Release all graded to students (N) → confirm; or row Release, Withdraw |
| US-32 | R25 `C/gradebook`, R24 | Course nav Gradebook → cell → grading view |
| US-33 | R25, R29 `C/gradebook.csv` | Gradebook → Export CSV |
| US-34 | R26 `C/people` | Course nav People |
| US-35 | R26 | People → Add student → email → Add |
| US-36 | R26, R25, R23 | People → Remove → confirm |
| US-37 | R17 `C/discussions/:threadId`, R15 | Discussions → thread → Delete (post or thread) → confirm |
| US-38 | R27 `/admin/users` | Sign in as admin → Users table → Search, Role filter |
| US-39 | R27 | Users → New user → Save |
| US-40 | R27 | Users → row Deactivate or Reactivate → confirm |
| US-41 | R27 | Users → row Reset password → Save |
| US-42 | R28 `/admin/courses`, then R2, R8, R18 as teacher | Admin → Courses → New course → Save; Ingrid sees the card and empty states |
| US-43 | Guards on R23, R25, R27, R28, R29 and the users API | Direct URL as wrong role → "You don't have access" page; no Admin link in top bar |

## Click budget

A click is a pointer activation of a link or button. Typing, Tab and Enter do not count (US-9 counts the same way). All counts start on the dashboard right after sign-in and end when the task is done.

| Core task | Clicks |
|---|---|
| Sign in to seeing what is due | 0 |
| Submit an assignment | 2 |
| Read latest feedback | 2 |
| Post an announcement | 3 |
| Grade the next submission | 3 |
| Release grades | 3 |
| Create an assignment | 3 |
| Find a course's material | 3 |

How each count is reached:
- **Sign in to seeing what is due (0):** the student dashboard opens on Upcoming; no click after sign-in.
- **Submit an assignment (2):** Upcoming row → Submit.
- **Read latest feedback (2):** Notifications bell → "Grade released" item, which opens the assignment with score and feedback. Via Grades it is 3.
- **Post an announcement (3):** teacher course card → New announcement on Course home → Post.
- **Grade the next submission (3):** "N need grading" on the course card → first row → Save.
- **Release grades (3):** "N need grading" on the course card → Release all graded to students (N) → confirm in the dialog.
- **Create an assignment (3):** course card → New assignment on Course home → Save and publish.
- **Find a course's material (3):** course card → Modules → item.

## Responsive

Breakpoint: 820 px (matches `styles.css`). Also checked at 390 px and 320 px. No page may scroll horizontally.

- **Top bar** keeps every label (Calendar, Notifications with count, name menu, Admin) and wraps to a second row instead of dropping items.
- **Course navigation** leaves the left column. A "Course pages" button beside the course title expands the same seven or eight items inline (a disclosure, not a modal). Menu has `aria-expanded` and `aria-controls`; Escape closes it and returns focus to Menu. (Changed in M3 from a slide-in panel: an inline disclosure needs no focus trap and keeps the page context visible.)
- **Layout:** `.main` padding drops to 16 px; `.split` is already one column below 1080 px; page-header actions wrap under the title; list rows allow the side text (`row-side`) to wrap under the title.
- **Targets:** buttons, links in lists and form controls are at least 44 px tall (24 px is the floor of US-20).
- **Calendar:** month grid becomes a day-by-day list of days that have items.
- **Tables:** Gradebook, Users, Courses and Grades stay tables inside `.table-wrap`, which scrolls horizontally on its own; the first column is sticky so names stay visible. The page itself does not scroll sideways.
- **Forms:** one column; fixed action bars are not used; the primary button is full width under 480 px.
- **Dialogs:** `min(560px, 100vw - 32px)`; confirmation buttons stack with the primary on top.
- **Grading view:** submission and grade form stack (submission first, then the form).
- **Text:** no truncation of titles under 820 px; titles wrap. Nothing is hidden on mobile that exists on desktop.

## Keyboard & screen reader

**Landmarks** (one of each, every page): `header` as `banner` (top bar); `nav aria-label="Main"` inside it; on course routes `nav aria-label="Course"`; Settings and Admin sub-navigation are `nav aria-label="Settings"` and `"Admin"`; Grading filters are `nav aria-label="Filter"`; exactly one `main` with `id="main"`. Page sections inside `main` are `section` elements labelled by their h2 (the `Section` primitive). A status live region (`role="status"`) is mounted once for toasts. No other landmarks.

**Skip link:** the first Tab stop on every page is "Skip to main content" (`.skip-link`), which moves focus to `main` (`tabindex="-1"`). On sign-in it targets the card.

**Heading order:** exactly one h1 per page, in `main`, naming the page. Sections are h2, items inside sections h3 only when they need a heading (module items are list entries, not headings). No levels are skipped. The top bar and course navigation contain no headings, except the visually hidden "Course navigation" label which is an `aria-label`, not a heading.

**Document title** changes on every route: `<Page> · <COURSE> · Scientia`.

**Focus after navigation:** on every route change focus moves to the new h1 (`tabindex="-1"`) so the screen reader announces the page; scroll to top. Exceptions: sign-in focuses Email; changing a filter or month keeps focus on the control used and updates a polite live announcement ("Showing 2 submissions").

**Focus after actions in a page:**
- Validation fails: focus the first invalid field; errors are text under the field linked by `aria-describedby`; a summary `role="alert"` above the form when two or more fields fail.
- Submit succeeds and the page stays: focus moves to the confirmation heading ("Submitted") in a `role="status"` region.
- Create succeeds and returns to a list: focus the h1 of the list and the new item is first or last as the story says.
- Delete or remove: focus moves to the heading of the list's region (or the next row's primary link).

**Dialogs:** native `<dialog>` via the `Dialog` primitive. On open, focus goes to the first field; for a confirm dialog without fields, to Cancel (never the destructive button). Tab is contained; Escape or Cancel closes. On close, focus returns to the control that opened it; if that control no longer exists, apply the delete rule above. One dialog at a time; a dialog never opens another.

**Menus:** the name menu and "Course pages" button are disclosure buttons with `aria-expanded`; Escape closes and returns focus to the button; items are plain links and buttons in tab order.

**Status and colour:** every status is text in a badge; colour only reinforces it. Required and invalid fields are conveyed in text, not colour. Focus outline is the 2 px `--focus` ring, never removed.

**Keyboard coverage:** every action is a button or link reachable by Tab; Enter submits forms; no hover-only controls; no custom shortcuts in M3. Tables have `<th scope>`; the month grid and gradebook are real tables with captions (visually hidden if needed).
