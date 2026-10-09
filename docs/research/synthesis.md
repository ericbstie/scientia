# Synthesis: what we learned and what Scientia will be

This merges the seven research notes ([blackboard.md](blackboard.md), [canvas.md](canvas.md), [moodle.md](moodle.md), [google-classroom.md](google-classroom.md), [brightspace-itslearning.md](brightspace-itslearning.md), [pain-points.md](pain-points.md), [design-patterns.md](design-patterns.md)) into one position. The committed scope is the 43 stories in `docs/stories/`.

## Positioning

Scientia is a calmer, better-designed alternative to Blackboard and Canvas for students who hand in work and teachers who collect and grade it. It does fewer things than the incumbents and does the common ones in fewer clicks.

- Against Blackboard and Brightspace: fewer clicks and one visible course layout instead of deep navigation (blackboard.md pain point 1, brightspace-itslearning.md pain point 1).
- Against Canvas: the same strengths (one place for work, a to-do list, announcements) with a complete deadline list, calm notification defaults and a gradebook that does not leave students guessing.
- Against Moodle: one plain deadline model and a small set of teacher settings instead of option sprawl.
- Against Google Classroom: the simplicity, with the pieces Classroom lacks in higher education: a real gradebook, organised material and threaded discussions.

Scientia's M3 promise: a student can see everything due, hand work in and read trusted grades; a teacher can publish material, collect work, grade and release; an admin can set up courses and accounts. It is a responsive web app, accessible to WCAG 2.2 AA, with no integrations, no email and no AI.

## Feature matrix

"Unknown" means the research did not establish it. Story ids refer to `docs/stories/`. Entries about specific products follow the cited research files and are not independent verification.

| Feature area | Blackboard | Canvas | Moodle | Google Classroom | Brightspace | itslearning | Scientia decision |
|---|---|---|---|---|---|---|---|
| Courses & content | Ultra: one page, expanding modules, drag and drop; content hidden by default; course copy loses data | Modules with prerequisites, Blueprint reuse; layout varies by instructor | One page of sections; many resource types; dense | Stream plus Classwork topics; no subfolders, old units buried | Content tools, templates via add-ons; deep nesting | Resources from Drive/O365; reusable course plans | **M3.** One fixed course layout; modules of pages, files, links; drafts hidden by explicit publish (US-5, 6, 23, 24) |
| Announcements | Email, activity stream, pop-up on next visit | Whole-course post with notification | News forum, teacher-only posting, block on course page | Stream posts, one attachment, no pinning | Unknown; students cannot reply | Scheduled or real-time to groups | **M3.** Post, pin, read/unread, no replies (US-7, 25, 26) |
| Assignments & submission | Instructions without starting an attempt; no bulk group download | Text, file, on paper; weighted groups | Text and file; split dates (from, due, cut-off, time limit); draft mode, extra attempts | Four-state work view; individual or group targets | Submit button buried; comparatively easy | Per-student copies; work returned online | **M3.** File and/or text; one due date; late allowed or closed; resubmit until graded (US-8 to 11, 27, 28) |
| Grading & feedback | Inline multimedia, rubrics, SafeAssign; grades private until posted | SpeedGrader on one screen, annotation, rubrics | Marking states, PDF annotation, offline worksheets | Score plus comment, bulk actions, grade history | Cannot mark up papers directly | Inline annotation, rubrics | **M3.** Queue, score plus written feedback, draft versus released (US-13, 29, 30, 31). Rubrics and annotation Later |
| Gradebook | Item list and grid; automatic zeros on; 59% of AUM faculty said not working well | Weighting, drop lowest; reports of erased entries and sync issues | Categories, overlapping aggregation methods, colour with no legend | Basic grid; CSV/Sheets export; missing work defaults to zero | Called "a nightmare"; points edited in several places | Automatic recording; Excel export | **M3.** Grid, totals, legend, CSV, no automatic zeros (US-12, 32, 33). Weighting Later |
| Calendar & due dates | Calendar icon plus activity stream; rated low by students | Calendar plus to-do list (graded items only) | Calendar and timeline; drag to change activity dates | Due dates; calendar sync unverified | Students cannot add own due dates | Course plus personal calendar | **M3.** Complete upcoming list with a separate missing list, plus month calendar (US-3, 4, 14) |
| Discussions | Folders, analytics; no anonymous or moderated posts in Ultra | Threaded, graded; harder to follow after redesign | Forums with subscribe, star, pin, private reply | No native forum | Hard to organise, hard to see what is answered | Named, no detail | **M3.** Threads, flat replies, teacher delete (US-15, 37). Graded discussion Later |
| Messaging | Conversations on content; gaps | Inbox and chat; Inbox is a spam source | Private messaging drawer | Private comments on work | Hard for new students to contact people | Real-time, vague | **Later.** No inbox (design-patterns.md pain point 3) |
| Quizzes | Several question types missing in Ultra | Banks, time limits, analysis | Question bank, repeat attempts | No native quiz engine | Self-marking; automatic zeros for manual questions | Self-marking; test-mode browser | **Later** |
| Groups | Limited, no group file space | Listed; depth unverified | No groups, separate, visible modes | Up to 75 groups; creation needs paid tier | Unknown | Projects for study groups | **Later** |
| Attendance | Available in Ultra | Unknown | Plugin only | Not native | Unknown | Not mentioned | **Later** |
| Notifications | Activity stream plus daily emails; premature "marks available" notices | Per-type controls; noisy defaults, buried settings | Web, email, mobile per user; reported failures | Pile up per class; hard to customise | Limited; no reply push on phone | Alerts for key events; scope undocumented | **M3.** In-app only, five meaningful kinds all on by default, once per event, per-type switches (US-16 to 18) |
| Mobile | Browser use improved in Ultra; app crashes and repeated sign-ins | Three apps; weaker than desktop | App with offline and grading; weak forum writing | Apps with offline review; slow | Weak; no number grades | Two apps; today and tomorrow view | **M3.** Responsive web (US-21). Native app and offline Later |
| Accessibility | "Partially compliant" with WCAG 2.2 AA; keyboard and zoom gaps | Documented testing process; VPAT level unverified | WCAG 2.2 AA claimed for 4.5.7 and later; content gaps | 2019 VPAT, partial on five criteria | Auditor-verified ACR claims 2.2; partial on five criteria | 2.1 claimed; inconsistent screen reader support | **M3.** WCAG 2.2 AA target with automated checks (US-20) |
| Integrations | Content Market, Zoom, SafeAssign, Turnitin | 1,000+ LTI tools, API, SIS | LTI, plugin directory, SCORM | Drive, Docs, Meet; LTI via Workspace | LTI, API, D2L Link | SSO, SIS, Teams, Zoom | **Not in M3** (constraint) |
| Roles & admin | System-level tool set; complex setup | Subaccounts, roles, templates | Flexible roles; complex | Teacher, student, guardian; paid tiers | Admin tools; cost for small schools | Admin tools, parent dashboard | **M3.** Three fixed roles; admin creates users and courses; teacher adds students by email (US-35, 38 to 43) |

## Top 10 pain points we design against

1. **Deadlines hidden or incomplete.** To-do lists omit ungraded or undated items, or sort overdue work first and bury current work. Evidence: [pain-points.md](pain-points.md) (Pain points 1, 2), [design-patterns.md](design-patterns.md) (Pain points 5, 6). Design response: US-3, 4.
2. **Notification floods.** Alerts on every post and edit teach students to mute or spam-filter everything. Evidence: [pain-points.md](pain-points.md) (Pain points 3 to 7), [canvas.md](canvas.md) (Pain point 2), [google-classroom.md](google-classroom.md) (Pain point 5), [design-patterns.md](design-patterns.md) (Pain point 2). Design response: US-16 to 18.
3. **Every course looks different.** Students relearn navigation and cannot find material. Evidence: [pain-points.md](pain-points.md) (Pain point 9), [canvas.md](canvas.md) (Pain point 1), [blackboard.md](blackboard.md) (Pain point 9). Design response: US-5, 6.
4. **Too many clicks and deep navigation.** Reaching a document or rubric takes several panels. Evidence: [blackboard.md](blackboard.md) (Pain point 1), [brightspace-itslearning.md](brightspace-itslearning.md) (Pain point 1), [moodle.md](moodle.md) (Pain point 4). Design response: click budgets in US-9 and US-22.
5. **Grades that are wrong, late, hidden or hard to configure.** Students cannot tell if they are passing, teachers fight the gradebook. Evidence: [pain-points.md](pain-points.md) (Pain point 8), [blackboard.md](blackboard.md) (Pain point 2), [canvas.md](canvas.md) (Pain point 3), [brightspace-itslearning.md](brightspace-itslearning.md) (Pain point 3). Design response: US-12, 31, 32.
6. **Silent defaults that change outcomes.** Automatic zeros, content hidden by default, accidental result releases with no undo. Evidence: [blackboard.md](blackboard.md) (Pain points 3, 10; Worth avoiding), [google-classroom.md](google-classroom.md) (Worth avoiding). Design response: no automatic zeros (US-12, 32), explicit draft and release (US-23, 31).
7. **Unclear deadline rules and vague errors.** Split date models and "Submit failed" when a window has closed. Evidence: [pain-points.md](pain-points.md) (Pain point 10), [moodle.md](moodle.md) (Pain point 13). Design response: one due date plus an allow-late switch (US-11, 27).
8. **Accessibility barriers.** Screen reader and keyboard failures, partial WCAG conformance. Evidence: [pain-points.md](pain-points.md) (Pain point 11), [blackboard.md](blackboard.md) (Pain point 13), [brightspace-itslearning.md](brightspace-itslearning.md) (Pain point 7). Design response: US-20.
9. **Setting sprawl for teachers.** Simple tasks take hours; overlapping options. Evidence: [moodle.md](moodle.md) (Pain points 2, 3, 7), [canvas.md](canvas.md) (Pain point 8). Design response: a short assignment form with no extra settings (US-27).
10. **Slowness, lost work and no undo.** Crashes, repeated sign-ins, disappearing items, no way to withdraw a mistaken release. Evidence: [blackboard.md](blackboard.md) (Pain points 4, 6, 7, 10), [brightspace-itslearning.md](brightspace-itslearning.md) (Pain point 5), [canvas.md](canvas.md) (Pain point 5). Design response: confirmations, Withdraw release (US-31), persistent sessions (US-2), typed text kept when a submission fails (US-9). Slowness is only tracked through bundle size in M3; a wider performance budget is in Later.

## Five design principles

1. **One predictable course, fewest clicks.** Every course has the same navigation in the same order. The common tasks (see what is due, submit, grade) take two or three clicks from the first screen.
2. **Every deadline in one list.** If it has a due date, it is on the dashboard and calendar. Missing work is shown apart from upcoming work.
3. **Calm by default.** In-app only. Notify once per event, never for cosmetic edits (a changed due date is a meaningful event and does notify), and only for things that concern the person. All five notification kinds (New announcement, New assignment, Due date changed, Grade released, Replies to me) are on by default: calm comes from having only five meaningful kinds, once each, in the app only, not from hiding them. Each can be switched off.
4. **Grades students can trust.** Draft and released are separate, visible states. No automatic zeros. A released grade can be withdrawn. The same numbers appear in every view.
5. **Accessible from the start.** WCAG 2.2 AA, keyboard-first, skip link and landmarks, automated checks in the test suite (design-patterns.md: Funka found workarounds cost more than building accessibly at the start).

## Later: deliberately not in M3

These have no story ids. They are ideas the research supports, held back for scope or because the M3 constraints rule them out.

- Quizzes and question banks: large build; core flow works without them.
- Groups and group assignments: needs roster and grading changes; little evidence of a lightweight winning pattern.
- Attendance: not native in most competitors; teacher complaints unknown.
- Rubrics and inline PDF or audio feedback: valued by teachers, but score plus written feedback covers the 80% path.
- Peer review and graded discussions: extra grading modes.
- Direct messaging and inbox: research warns against scattered comments; revisit as comments on submissions.
- Email notifications and digests: M3 has no email delivery.
- Password reset by email and self-registration: depend on email; admins reset passwords in M3.
- Native mobile app and offline mode: M3 ships responsive web only.
- LTI tools, SIS roster sync, SSO (Feide), plagiarism checks, video conferencing and proctoring: excluded by the M3 constraints.
- AI features: excluded by the M3 constraints.
- Weighted categories, drop lowest, curves and manual grade overrides: add gradebook complexity before the basics are proven.
- Individual extensions and accommodations: Blackboard's set-once accommodations are a good model for later.
- Course copy and templates (Blueprint style): high value year to year, but a risky build because copies lose data in Blackboard.
- Reordering modules by drag and drop, and bulk edit of dates: convenience on top of a working layout.
- Trash and undo for deletions: M3 uses confirmation dialogs and Withdraw release only.
- Student-view preview for teachers: helpful, not needed to ship.
- Calendar subscription (iCal) and external calendar sync: needs feeds and tokens.
- Parent and guardian access: separate role, privacy design needed.
- Analytics and reports: no strong evidence they are needed on day one.
- Command menu and keyboard shortcuts (Linear style): design-patterns.md rates them highly; keyboard basics ship first.
- Display personalisation (dyslexia font, high contrast): good idea from itslearning; after WCAG baseline.
- Onboarding starter content: only empty states in M3 (US-42).
- Localisation (for example Norwegian): English only in M3.
- Announcement expiry, archiving and an active-post cap (pain-points.md, Worth copying): pinning covers the M3 case.
- Performance budget beyond bundle size (response-time targets): M3 tracks bundle size only.
- Notification digests and per-course notification switches: M3 has one global switch per kind.
- Public data-use and privacy notice (canvas.md Pain point 6, brightspace-itslearning.md Pain point 10): not in M3.

## Research conflicts and how we resolved them

- **Google Classroom coverage.** [pain-points.md](pain-points.md) says Google Classroom was not researched, but [google-classroom.md](google-classroom.md) exists. We used [google-classroom.md](google-classroom.md) and treated its evidence as mostly K-12.
- **Messaging.** Blackboard praises conversations attached to content; [design-patterns.md](design-patterns.md) says avoid a separate inbox. We defer messaging; if added, it attaches to the work item.
- **Mobile offline.** Moodle docs list offline features while one reviewer reports none. We rely on neither: M3 has no offline mode.
- **Blackboard satisfaction.** The student study contradicts itself (58% vs 90%). We cite only the item-level findings, not the totals.
- **Missing work.** Blackboard and Classroom default missing work to zero; research marks this as a pain point. We show Missing and never invent a zero.
- **Late rules.** Moodle's split model (due date, cut-off, time limit) is the cautionary case. We use one due date and one switch.
