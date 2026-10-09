# Moodle: research for Scientia

Scope: open-source breadth. Which Moodle features matter for students and teachers handing in work, seeing announcements, course material, due work and grades, and how Moodle's complexity hurts usability. Unless a claim says otherwise, documentation links point to Moodle 4.1 docs (`/401/`) or the unversioned current docs, so behaviour may differ in newer releases.

## Summary

- Moodle covers almost everything Scientia's core flow needs (materials, announcements, assignments, grades, calendar, messaging), but it exposes far more options than most users need, and the cost lands on teachers during setup.
- The most repeated complaints are a dated, dense interface, hard-to-find settings, and a gradebook with overlapping aggregation options (Capterra, moodle.org forum, Edwiser).
- Deadline handling is split across "allow submissions from", "due date", "cut-off date" and a time limit that only flags late work. Students and teachers both have to learn this model.
- Mobile covers grading, offline downloads, and push notifications, but reviewers still report weak mobile forum writing and fragile notifications.
- Accessibility is a relative strength: Moodle reports a WCAG 2.1 AA audit for 4.0 and a WCAG 2.2 AA claim for 4.5.7 and later, but course content quality remains the main accessibility risk.

## Features by area

Each area notes what Moodle offers (with source) and "not offered" or "unknown" where the research did not confirm a feature.

**Courses & content**
- Course is a single page of sections. Resources include links, books, files, and pages. Activities include assignments, quizzes, forums, wikis, and e-portfolios. Source: https://lead.mic.ul.ie/moodle/what-is-moodle and https://docs.moodle.org/en/Features
- Teachers can embed multimedia and external resources; LTI external tools let teachers link third-party content (see Integrations). Source: https://docs.moodle.org/en/Features
- Mobile app can download course sections and Books and IMS packages for offline use. Source: https://docs.moodle.org/en/Moodle_app_features

**Announcements**
- Each course gets one News forum (Announcements) by default. Only teachers can post by default; students cannot. Source: https://docs.moodle.org/401/en/News_forum
- The Latest announcements block shows recent posts on the course page. Source: https://docs.moodle.org/401/en/News_forum
- Whether students can reply to announcements: unknown. Whether announcements are emailed by default: unknown (forced subscription is on by default, per the same page).

**Assignments & submission**
- Submission types: online text (autosaves, optional word limit) and file upload (per-file size and type limits). Source: https://docs.moodle.org/401/en/Assignment_settings
- Dates: "Allow submissions from", "Due date" (later submissions are allowed and marked late), "Cut-off date" (blocks submission), "Remind me to grade by". Source: https://docs.moodle.org/401/en/Assignment_settings
- "Time limit" must be enabled by admin and flags late submissions rather than blocking them. Source: https://docs.moodle.org/401/en/Assignment_settings
- Draft and click-to-submit mode, extra attempts (manual or auto-reopen until pass), attempt cap, and a submission statement. Source: https://docs.moodle.org/401/en/Assignment_settings
- Group submissions and anonymous marking. Source: https://docs.moodle.org/401/en/Assignment_settings
- Individual extensions: unknown from the page fetched. Late-flag and cut-off dates are the only deadline controls the page describes.

**Grading & feedback**
- Marking workflow with states (Not marked, In review, Ready for release, Released) that hide grades until release; marking allocation to assign markers. Source: https://docs.moodle.org/401/en/Assignment_settings
- Feedback types: comments, PDF annotation, offline grading worksheet (download, edit, re-upload), feedback files, inline comments on online text. Source: https://docs.moodle.org/401/en/Assignment_settings
- Teachers can grade assignments on mobile, including offline. Source: https://docs.moodle.org/en/Moodle_app_features

**Gradebook**
- Items sit in categories; each category can show grades only, totals only, or both. Source: https://docs.moodle.org/401/en/Gradebook
- Aggregation methods and weighting are configured separately from the grader report; the grader report page refers to a separate aggregation page. Source: https://docs.moodle.org/401/en/Gradebook
- Manual overrides are highlighted; quick grading and bulk insert are available. Quick grading can lose unsaved changes. Source: https://docs.moodle.org/401/en/Gradebook
- Admins set many defaults system-wide, and some can be locked. Source: https://docs.moodle.org/401/en/Gradebook
- Competency-based marking and progress tracking exist. Source: https://docs.moodle.org/en/Features

**Calendar & due dates**
- Calendar shows site, course, group, user, and category events, with assignment and quiz deadlines and colour coding. Source: https://docs.moodle.org/401/en/Calendar
- Feedback, assignment, and choice events can be dragged to new dates, and the activity's dates update to match. Source: https://docs.moodle.org/401/en/Calendar
- Timeline view: the Features page lists a "see-at-a-glance timeline". Source: https://docs.moodle.org/en/Features
- Calendar export and subscription (iCal feeds): unknown from the page fetched.
- Mobile calendar can be viewed offline. Source: https://docs.moodle.org/en/Moodle_app_features

**Discussions (forums)**
- Forum types exist; the default is Standard. Source: https://docs.moodle.org/401/en/Forums
- Students subscribe with a toggle, star discussions for bookmarking, and can edit posts for a limited window ("usually 30 minutes", admin-set). Teachers can pin, star, or lock discussions. Source: https://docs.moodle.org/401/en/Forums
- Private replies from a teacher are seen only by the student, who cannot reply to them. Source: https://docs.moodle.org/401/en/Forums

**Messaging**
- Private messages between users, with a messaging drawer grouping starred, group, and personal conversations. Admins can disable messaging. Source: https://docs.moodle.org/401/en/Messaging
- Group conversations are created by teachers (or users with capability) and only members see them. Source: https://docs.moodle.org/401/en/Messaging
- Users can restrict who can message them (contacts, or contacts and course members). Source: https://docs.moodle.org/401/en/Messaging
- Deletion removes a message only from the deleting user's view. Source: https://docs.moodle.org/401/en/Messaging

**Quizzes**
- Question bank stores questions for reuse; random questions can be drawn from a category. Source: https://docs.moodle.org/401/en/Quiz
- Students can repeat attempts, flag questions, and finish with "Submit all and finish". No time limit by default. Source: https://docs.moodle.org/401/en/Quiz
- Question types: exist, but the list was not confirmed from the fetched page.
- Quizzes are playable on mobile. Source: https://docs.moodle.org/en/Moodle_app_features

**Groups**
- Group modes: no groups, separate groups (members see only their group), visible groups (read-only view of others). Source: https://docs.moodle.org/401/en/Groups
- Course-level default with per-activity override, unless forced. Source: https://docs.moodle.org/401/en/Groups
- Groupings, auto-create, and activity access restriction by group. Source: https://docs.moodle.org/401/en/Groups

**Attendance**
- Not in core Moodle. Attendance is an optional plugin (activity module plus block) from the plugin directory. Teachers create sessions, record statuses (Present, Absent, Late, Excused, renamable), export reports; students can self-mark with a session password or QR code. Source: https://docs.moodle.org/400/en/Attendance_module

**Notifications**
- Three channels: web (notifications menu), email, and mobile (only on sites with the app enabled). Per-user preferences. Source: https://docs.moodle.org/401/en/Notifications
- Default channel settings and limits: not specified in the page fetched.
- Notification events include forum posts, assignments needing grading, and badges. Source: https://docs.moodle.org/401/en/Notifications
- Mobile push covers messages, forum posts, and submitted assignments. Source: https://docs.moodle.org/en/Moodle_app_features

**Mobile**
- App covers courses, timeline, calendar (offline), course content and downloads, grading (including offline), messaging, quizzes, SCORM and H5P (online or offline), self-enrolment, QR login, and private files (up to 50 MB noted). Source: https://docs.moodle.org/en/Moodle_app_features
- The page does not list unsupported mobile features; it defers to a separate comparison PDF that was not available. Mobile gaps are therefore reported from user reviews (see Pain points).

**Accessibility**
- WCAG 2.1 AA accreditation claimed for Moodle 4.0 after an audit by WebKeyIT (article dated May 2023). Source: https://educatingalllearners.org/moodle-lms-4-0-achieves-wcag-2-1-aa-accessibility-compliance/
- A university accessibility statement says Moodle 4.5.7 and later was audited on 3 October 2025 and received WCAG 2.2 AA status, scoped to core functionality. Source: https://gla.ac.uk/legal/accessibility/statements/moodle (institution's claim; the audit report itself was not reviewed)
- Known issues in that statement: unclear link text, colour contrast, non-descriptive headings, missing alt text, uploaded files lacking language settings. Source: https://gla.ac.uk/legal/accessibility/statements/moodle
- Course content, not the platform, drives most accessibility outcomes. Source: https://educatingalllearners.org/moodle-lms-4-0-achieves-wcag-2-1-aa-accessibility-compliance/

**Integrations**
- LTI external tools; grades can be returned where the provider supports it; students log in only to Moodle. Setup needs a tool URL, consumer key, and shared secret for manual setup. LTI version support: unknown from the page fetched. Source: https://docs.moodle.org/401/en/External_tool
- Open standards and embedding of external resources. Source: https://docs.moodle.org/en/Features
- Plugin directory: vendor claim of over 2000 plugins (https://www.g2.com/products/moodle/reviews); a third-party blog says "well over a thousand" with variable quality (https://www.lambdalearn.io/en/blog/the-20-must-have-moodle-modules).
- SCORM and H5P packages play online or offline in the app. Source: https://docs.moodle.org/en/Moodle_app_features

**Roles & admin**
- Permissions are roles assigned in a context (site, course, and others), built from capabilities. Custom roles, role export/import, and permission overrides exist. Source: https://docs.moodle.org/401/en/Roles
- Reporting: detailed reports and logs. Source: https://docs.moodle.org/en/Features
- Admin setup and configuration are spread across several areas; the separation of gradebook settings from aggregation is one example. Source: https://docs.moodle.org/401/en/Gradebook
- Simple plugin management: listed on the Features page. Plugin overview itself is criticised (see Pain points).
- Single-click student view: not available; users must switch roles from a menu (see Pain points). Source: https://moodle.org/mod/forum/discuss.php?d=239414

## Pain points

Each item is a complaint with its source. Several come from one or two posters, so weight accordingly.

1. **Dated, unappealing look.** Users describe the UI as "from another era", "old and out dated", and "not visually appealing". Sources: https://www.capterra.com/p/80691/Moodle/reviews/ ; https://edwiser.org/blog/problem-moodle-ui/ ; https://jerz.setonhill.edu/?p=19928 (Quora question "why is Moodle still so ugly after all these years?", with answers blaming complexity and few UX resources).

2. **Too many options; simple setups take hours.** A forum user took hours to set up a recurring course with weighted assignments and attendance, and expected teachers to struggle even after training. Source: https://moodle.org/mod/forum/discuss.php?d=239414 ; also https://www.capterra.com/p/80691/Moodle/reviews/ (steep learning curve; setup time).

3. **Hard-to-find settings and menus.** Users report lost settings, overwhelming sub-menus, and settings panels hard to distinguish from content. Source: https://edwiser.org/blog/problem-moodle-ui/ ; https://moodle.org/mod/forum/discuss.php?d=239414 (tree navigation mixes clickable and non-clickable items, confusing labels).

4. **Navigation load in a real study.** In a study of 140 IT students and 10 teachers, 62% of students disagreed that a back-to-top link existed, 59% that a sitemap existed, and 48% that visited and unvisited links were distinguishable. Students named 30 navigation problems, including difficulty finding content, deep navigation with many steps, and a crowded navigation block. Caveat: small teacher sample, two Pakistani universities. Source: https://ftp.saiconference.com/Downloads/Volume7No3/Paper_42-Evaluation_of_Navigational_Aspects_of_Moodle.pdf

5. **New students cannot find how to submit.** In the same study, first-year students with little Moodle experience struggled to find how to attach an assignment, and no adequate help was available. Source: https://ftp.saiconference.com/Downloads/Volume7No3/Paper_42-Evaluation_of_Navigational_Aspects_of_Moodle.pdf

6. **Teachers need help to build a quiz.** Eight of 10 teachers in the same study said they needed help to create a quiz. Source: https://ftp.saiconference.com/Downloads/Volume7No3/Paper_42-Evaluation_of_Navigational_Aspects_of_Moodle.pdf

7. **Gradebook aggregation is confusing.** A 2018 forum post reports that the "huge range of features" confuses teachers, some cannot configure a gradebook without help, and aggregation methods and grade formulas sit in different submenus. The post cites MDL-61026, and the thread is locked with no replies. Source: https://moodle.org/mod/forum/discuss.php?d=376432 ; a forum user also calls the gradebook their least favourite area: https://moodle.org/mod/forum/discuss.php?d=239414

8. **Grader report colour with no legend.** Overridden grades are highlighted in a colour with no legend, which causes support problems. Source: https://moodle.org/mod/forum/discuss.php?d=239414

9. **Notifications fail.** A developer and former student reports notifications often fail and external links are often broken. Source: https://www.capterra.com/p/80691/Moodle/reviews/

10. **Mobile is weak for some tasks.** Forum replies are hard to write on mobile; mobile navigation is "a labyrinth" when a course is not well configured. Sources: https://moodle.org/mod/forum/discuss.php?d=239414 ; https://www.capterra.com/p/80691/Moodle/reviews/. Note: the official app docs list offline and grading features (https://docs.moodle.org/en/Moodle_app_features), and one reviewer reports no offline access; the two conflict or differ by configuration, so treat as unverified in either direction.

11. **Upgrades and plugins carry maintenance cost.** Plugins can fail to match versions, some lapse for years, and one plugin can block a whole core upgrade; each plugin is code to keep working. Source: https://www.lambdalearn.io/en/blog/the-20-must-have-moodle-modules . Reviewers report upgrades that caused bugs and hosting that needs a team. Source: https://www.capterra.com/p/80691/Moodle/reviews/

12. **Hosting and setup need technical skill.** Reviewers report setup on free hosting needed more server access than available and that theming needs a skilled developer. Source: https://www.capterra.com/p/80691/Moodle/reviews/

13. **Deadline model is split and soft.** The due date allows late submission, the cut-off date blocks it, and the time limit only flags late work. Source: https://docs.moodle.org/401/en/Assignment_settings

14. **Bulk feedback upload is fragile.** Zip-based bulk feedback is error-prone; editing files in the original folder does not work, and Mac-generated folders must be removed. Source: https://docs.moodle.org/401/en/Assignment_settings

15. **Quick grading loses unsaved work; overrides can be bulk-inserted.** Source: https://docs.moodle.org/401/en/Gradebook

16. **Student role switching is cumbersome.** Switching to the Student role requires scrolling and choosing among eight options. Source: https://moodle.org/mod/forum/discuss.php?d=239414

17. **Accessibility gaps remain in content.** Unclear link text, contrast, and missing alt text are listed as known issues; live video has no captions. Source: https://gla.ac.uk/legal/accessibility/statements/moodle

18. **Reporting is cluttered.** A MoodleCloud admin reports irrelevant columns and missing metrics in the performance usage report. Source: https://www.capterra.com/p/80691/Moodle/reviews/

Reddit: searches returned no usable Reddit threads on Moodle complaints; this source type is not represented (unverified gap).

## Worth copying

- **One plain deadline model.** Show a single due date with a clear rule for late work, and keep any cut-off as a visible, separate option. Moodle's split of allow-from, due, cut-off, and time limit is the thing to avoid. Source: https://docs.moodle.org/401/en/Assignment_settings
- **Calendar linked to real activity dates.** Dragging an assignment in the calendar updates the activity itself. Source: https://docs.moodle.org/401/en/Calendar
- **Announcements pinned to the course page.** One default announcements channel, visible on the course page via a block. Source: https://docs.moodle.org/401/en/News_forum
- **Offline course content and grading on mobile.** Source: https://docs.moodle.org/en/Moodle_app_features
- **Named marking states.** Not marked, In review, Ready for release, Released make grade visibility explicit. Source: https://docs.moodle.org/401/en/Assignment_settings
- **Plain group modes.** No groups, separate, visible, with a course default. Source: https://docs.moodle.org/401/en/Groups
- **Question bank reuse.** Store quiz questions once and reuse them. Source: https://docs.moodle.org/401/en/Quiz
- **Notification channel choice per user.** Web, email, mobile, set per person. Source: https://docs.moodle.org/401/en/Notifications
- **Accessibility as a stated, audited commitment.** Moodle publishes audit status per release. Source: https://educatingalllearners.org/moodle-lms-4-0-achieves-wcag-2-1-aa-accessibility-compliance/

## Worth avoiding

- **Overlapping aggregation methods.** Several near-identical options and a "Natural" method that did not replace the old ones. Source: https://moodle.org/mod/forum/discuss.php?d=376432
- **Tree navigation mixing clickable and non-clickable items.** Source: https://moodle.org/mod/forum/discuss.php?d=239414
- **Repeated navigation and administration blocks on every page.** Source: https://moodle.org/mod/forum/discuss.php?d=239414
- **Colour-coded state with no legend.** Source: https://moodle.org/mod/forum/discuss.php?d=239414
- **A time limit that flags rather than enforces.** Source: https://docs.moodle.org/401/en/Assignment_settings
- **Plugin dependence for core needs.** Attendance is a plugin, so a school needing it depends on third-party code. Source: https://docs.moodle.org/400/en/Attendance_module ; https://www.lambdalearn.io/en/blog/the-20-must-have-moodle-modules
- **Exposing the full role system to teachers.** Source: https://moodle.org/mod/forum/discuss.php?d=239414 (flexible role system limits simpler interface options)
- **Unsaved-change loss in quick grading.** Source: https://docs.moodle.org/401/en/Gradebook

## Sources

1. https://docs.moodle.org/en/Features
2. https://docs.moodle.org/en/Moodle_app_features
3. https://docs.moodle.org/401/en/Gradebook
4. https://docs.moodle.org/401/en/Quiz
5. https://docs.moodle.org/401/en/Forums
6. https://docs.moodle.org/401/en/News_forum
7. https://docs.moodle.org/401/en/Assignment_settings
8. https://docs.moodle.org/401/en/Groups
9. https://docs.moodle.org/401/en/Calendar
10. https://docs.moodle.org/401/en/Messaging
11. https://docs.moodle.org/401/en/Notifications
12. https://docs.moodle.org/401/en/External_tool
13. https://docs.moodle.org/401/en/Roles
14. https://docs.moodle.org/400/en/Attendance_module
15. https://research.moodle.org/396 (study summary; full text not available from the repository; the 17-problem count is from the abstract)
16. https://edwiser.org/blog/problem-moodle-ui/
17. https://www.capterra.com/p/80691/Moodle/reviews/
18. https://moodle.org/mod/forum/discuss.php?d=239414
19. https://moodle.org/mod/forum/discuss.php?d=376432
20. https://ftp.saiconference.com/Downloads/Volume7No3/Paper_42-Evaluation_of_Navigational_Aspects_of_Moodle.pdf
21. https://jerz.setonhill.edu/?p=19928
22. https://www.lambdalearn.io/en/blog/the-20-must-have-moodle-modules
23. https://www.g2.com/products/moodle/reviews (vendor overview; no user reviews could be read)
24. https://gla.ac.uk/legal/accessibility/statements/moodle
25. https://educatingalllearners.org/moodle-lms-4-0-achieves-wcag-2-1-aa-accessibility-compliance/
26. https://lead.mic.ul.ie/moodle/what-is-moodle

Not used: https://www.capterra.com/compare/80691-145543/Moodle-vs-Collaborator (no Moodle content). Research gap: the research.moodle.org study (17 problems) lacks the individual problem list; unverified detail.
