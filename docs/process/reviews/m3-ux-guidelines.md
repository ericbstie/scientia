# M3 review: ux-guidelines lens

- **Reviewer:** reviewer (haiku), lens `ux-guidelines` only
- **Brief:** `docs/process/briefs/m3-review.md`
- **Checked against:** `docs/design/ui-guidelines.md`, `docs/design/ia.md`
- **Code read:** `app/src/App.tsx`, `app/src/ui/index.tsx`, `app/src/styles.css` (for evidence only), `app/src/lib/format.ts`, `app/src/pages/**` except the assignment and grading stubs (`Assignments`, `AssignmentForm`, `AssignmentView`, `Grades`, `Grading`, `GradingSubmission`, `Gradebook`), which were skipped as instructed.

Severity: **blocker** = a user cannot finish a story; **should-fix** = breaks an explicit rule in the guidelines or ia, or causes a real problem for a user; **nit** = copy, consistency or polish.

## Findings

### Should-fix

**S1. Top bar has a "Dashboard" link that the IA does not list; for admins it lands on Users.**
- `app/src/App.tsx:136` renders `<NavLink to="/" end>Dashboard</NavLink>` for every role.
- `docs/design/ia.md:16` lists the top bar as logo, Calendar, Notifications, Admin, name menu. There is no Dashboard item (the logo goes to `/`).
- `app/src/App.tsx:102-104`: `HomeRoute` sends admins to `/admin/users`. An admin who clicks "Dashboard" lands on the Users table with no sign that they were moved.
- Fix: remove the link (the logo already goes home), or hide it for admins.

**S2. On phones the Notifications bell has no visible label.**
- `app/src/styles.css:118` `.nav-label { display: none; }` applies below 820 px. `app/src/App.tsx:142` puts the word "Notifications" in that span. The bell is left as an icon with a count.
- Rule broken: `ui-guidelines.md:76` (icons need a visible text label; "The bell shows the word 'Notifications' and its count"). Also `ia.md:382` ("keeps every label") and `ia.md:391` ("Nothing is hidden on mobile that exists on desktop").
- User impact: sighted phone users have to guess what the bell is.
- Fix: keep the label visible below 820 px, for example by wrapping the label or shortening it, and check the top bar at 320 px.

**S3. Course Menu on phones does not behave as the IA specifies.**
- `app/src/App.tsx:211-213` and `:255-262`: `menuOpen` only toggles the `open` class. There is no Escape handler, no scrim, no focus trap and no focus return to the Menu button.
- `ia.md:383` specifies a slide-in panel (`.sidebar.open` with `.scrim`) that traps focus, closes on Escape or scrim click, and returns focus to Menu. `ia.md:413` repeats the Escape and focus-return rules.
- `app/src/styles.css:137-144` only shows and hides the list inline.
- User impact: keyboard users can get stuck in the open menu and Escape does nothing.
- Fix: add the Escape key handler and focus return now. Add the scrim and focus trap, or record a decision to drop them in the IA.

**S4. Touch targets are below the 44 px the IA asks for.**
- `app/src/styles.css:166` `.btn` is 36 px tall. `:176` `.btn.small` is 30 px. `:99` `.nav-link` is 36 px.
- `ia.md:385`: "buttons, links in lists and form controls are at least 44 px tall". No `44px` rule exists in `styles.css`.
- User impact: small buttons such as Pin, Edit, Delete and Remove are hard to hit on touch screens.
- Fix: add a `@media (pointer: coarse)` rule that sets `min-height: 44px` for `.btn`, `.nav-link` and `.row-title` links.

**S5. Focus outlines are removed on two focus targets.**
- `app/src/ui/index.tsx:28`: `PageHeader` h1 has `style={{ outline: "none" }}`.
- `app/src/pages/Notifications.tsx:50`: the list container has `style={{ outline: "none" }}`. Focus lands there after "Mark all as read" (`Notifications.tsx:40`), and the container has no label, so the announcement is weak.
- Rule broken: `ui-guidelines.md:83` (no "removing the focus outline") and `ia.md:415` ("Focus outline is the 2 px `--focus` ring, never removed").
- Fix: keep the default outline on programmatic focus. Use `:focus:not(:focus-visible)` if the ring is unwanted on the h1, and do not remove it everywhere. For Notifications, move focus to the "Notifications" h1 (as `focusHeading()` does elsewhere).

**S6. No error summary on forms with two or more errors.**
- `ui-guidelines.md:62` says two or more errors get a `role="alert"` summary above the form. The code has none.
- `app/src/pages/admin/Users.tsx:126-138` (`NewUserForm`, up to three errors) and `:151-154`.
- `app/src/pages/admin/Courses.tsx:58-72` (`NewCourseForm`, up to three errors).
- `app/src/pages/course/Modules.tsx:254-259` (`LinkForm`, up to two errors). Only the first invalid field gets focus.
- User impact: a screen reader user submits and hears only the first error, or none. Fix: add a summary above the form that lists each message and links to its field.

**S7. `Select` cannot show an error and does not link its hint; the Courses form duplicates the markup.**
- `app/src/ui/index.tsx:116-126`: `Select` has no `error` prop and no `aria-describedby`. The hint at `:123` has no id.
- `app/src/pages/admin/Courses.tsx:101-108`: the Teacher select is written out by hand with its own error span and `role="alert"`. That breaks `ui-guidelines.md:3` ("prefer the primitives").
- `app/src/pages/admin/Users.tsx:58` and `:155` use `Select` without error support, so a required select could never show an error through the primitive.
- Fix: add `error` and `hint` support to `Select` in the same pattern as `Field`, then use it in the Courses form.

**S8. Required fields are not marked in text.**
- `app/src/ui/index.tsx:90-101` (`Field`) has no `required` marker. `app/src/pages/SignIn.tsx:46-47` sets the HTML `required` attribute and shows nothing visible.
- Other required fields (announcement Title, page Title, Module name, New user Name, and so on) rely on a validation message only.
- Rule broken: `ui-guidelines.md:77` and `ia.md:415` ("Required and invalid fields are conveyed in text, not colour").
- Fix: add a visible "Required" text marker to required fields in `Field`, `TextArea` and `Select`, and link it through `aria-describedby`.

**S9. A failed "Mark all as read" shows only a toast.**
- `app/src/pages/Notifications.tsx:41-43` shows the error only with `toast(...)`. The toast disappears after 3.5 s (`app/src/ui/index.tsx:171`).
- Rule broken: `ui-guidelines.md:79` (forbidden: "A toast as the only place an error appears").
- Fix: show the message in an `ErrorNote` above the list, as the other pages do, and keep the toast for the success case only.

**S10. Repeated row buttons have the same accessible name on every row.**
- `app/src/pages/course/Announcements.tsx:95-97` (Pin, Edit, Delete on each row), `app/src/pages/course/Modules.tsx:116` (Delete on each item), `app/src/pages/course/ThreadView.tsx:122-123` (Delete on each post), `app/src/pages/course/People.tsx:75` (Remove on each student).
- A screen reader user hears "Delete, Delete, Delete" with no title. The admin page already does this correctly with `aria-label` (`app/src/pages/admin/Users.tsx:81-90`, for example "Deactivate Maya Okafor").
- Fix: give each row button an `aria-label` that includes the object name, for example "Delete announcement 'Field trip'", in the same pattern as `admin/Users.tsx`.

**S11. Month changes and filter changes are not announced.**
- `app/src/pages/Calendar.tsx:65` and `:73-74`: moving to another month only changes the `h2`. Nothing is announced.
- `app/src/pages/admin/Users.tsx:36-37` and `:57-63`: search and role filters change the list without an announcement.
- Rule: `ia.md:403` ("changing a filter or month keeps focus on the control used and updates a polite live announcement"). Example in the IA: "Showing 2 submissions".
- Fix: add a `role="status"` region that reads, for example, "Showing March 2027" or "Showing 3 users".

**S12. Document titles are set on course pages only.**
- `useDocTitle` is called only under `app/src/pages/course/`. `app/index.html:7` leaves the title as "Scientia".
- Routes without a title change: `app/src/pages/Dashboard.tsx:21`, `Calendar.tsx:71`, `Notifications.tsx:48`, `settings/Profile.tsx:63`, `settings/NotificationSettings.tsx:39`, `admin/Users.tsx:52`, `admin/Courses.tsx:24`, `SignIn.tsx:43`, plus `NoAccess` and `NotFound` in `ui/index.tsx:201-218`.
- Rule: `ia.md:401` ("Document title changes on every route: `<Page> · <COURSE> · Scientia`").
- Fix: set the title from `PageHeader` or from a shared hook, so each route gets one.

**S13. The sign-in page shows demo accounts and their shared password.**
- `app/src/pages/SignIn.tsx:50-60` lists three accounts and `DEMO_PASSWORD` in the page.
- Rule: `ia.md:71` lists the sign-in regions (h1, Email, Password, error alert, Sign in) and nothing else. `ui-guidelines.md:82` forbids "fields beyond the stories".
- User impact: none if the build is only for testing. If the build is public, this shows a password on the real sign-in form.
- Fix: remove the block from production builds, or gate it behind a build flag. Also a question for the security lens.

**S14. The Teacher select in "New course" has no options when no teacher exists, and does not say why.**
- `app/src/pages/admin/Courses.tsx:17` loads teachers. `:104-106` shows only the placeholder "Select a teacher" when the list is empty.
- The form then fails with "Choose a teacher" (`:69`) and the admin has no route to fix it on this screen.
- Fix: when `teachers` is empty, show text such as "No teachers yet. Add a teacher on the Users page first.", and disable Save with that reason next to it (`ui-guidelines.md:24`).

### Nit

**N1. Course navigation is 220 px, not the 248 px token.**
- `app/src/styles.css:125` uses `220px`. `:29` defines `--sidebar: 248px`, which nothing uses.
- Rule: `ui-guidelines.md:7` and `ia.md:11`.

**N2. Sign-in heading and focus differ from the IA.**
- `app/src/pages/SignIn.tsx:43` is `<h1>Sign in</h1>`. `ia.md:71` says "Sign in to Scientia".
- No `autoFocus` on Email (`SignIn.tsx:46`), but `ia.md:403` says sign-in focuses Email.

**N3. External links give no cue that they open in a new tab.**
- `app/src/pages/course/Modules.tsx:108` uses `target="_blank"`. The row meta says only "Link".
- `ia.md:62` says the item opens in a new tab. Add "(opens in a new tab)" to the meta line or to an accessible suffix.

**N4. Roles are shown as lowercase raw values.**
- `app/src/pages/admin/Users.tsx:60-62` and `:77` show "student", "teacher", "admin". Elsewhere the app uses "Teacher" as a label (`People.tsx:56`, `ThreadView.tsx:115`).
- Rule: `ui-guidelines.md:69-70` (sentence case, one term per concept).

**N5. Empty-state titles repeat or punctuate inconsistently.**
- `app/src/pages/Dashboard.tsx:85`: title "Nothing due" and body "Nothing due. New assignments appear here…".
- `app/src/pages/Calendar.tsx:129`: title "Nothing due" and body "Nothing is due this month.".
- `app/src/pages/course/Announcements.tsx:77`, `Discussions.tsx:31`, `Home.tsx:126` and `admin/Users.tsx:66` put full sentences with periods in the title.
- `app/src/pages/settings/Profile.tsx:26` ends with "Enter a display name." Other field errors have no period.
- Fix: use short titles and put the sentence in the body, with a consistent punctuation rule.

**N6. Some empty states are bare text, not `Empty`.**
- `app/src/pages/Dashboard.tsx:105` ("Nothing missing"), `app/src/pages/course/Home.tsx:67` and `:144` use `<p className="muted">`.
- Rule: `ui-guidelines.md:49` (use `Empty`).

**N7. Pin and Unpin confirm nothing, and a ghost button is set with a class.**
- `app/src/pages/course/Announcements.tsx:48-54` (`togglePin`) shows no toast. `ui-guidelines.md:57` says a completed action shows a short toast.
- `Announcements.tsx:95` and `:97` pass `className="ghost"` to `Button` instead of `variant="ghost"`. The look is the same, but the convention is split.

**N8. The Teachers list renders an empty box when there are no teachers.**
- `app/src/pages/course/People.tsx:46-61` renders an empty `<ul>` if the list is empty. `ui-guidelines.md:50` says an empty list never renders blank space.
- Unlikely in practice, but the fix is one `Empty` line.

**N9. Relative times use the browser locale; absolute dates use en-GB.**
- `app/src/lib/format.ts:22` uses `Intl.RelativeTimeFormat(undefined, …)`. `format.ts:3` uses `en-GB` for dates.
- In a non-English browser the line reads "vor 2 Tagen" next to an English date. Set the locale to `en-GB` in both places.

**N10. Admin passwords are typed in plain text.**
- `app/src/pages/admin/Users.tsx:160` and `:193` use `type="text"`. This may be intended so the admin can read back what they typed. If so, it needs a show/hide toggle or a note. Also a question for the security lens.

**N11. Each field error is itself a `role="alert"`.**
- `app/src/ui/index.tsx:98` and `:111` put `role="alert"` on every field error. Each one is announced separately when it appears.
- Rule: `ui-guidelines.md:62` reserves `role="alert"` for the summary, which S6 asks for.
- Fix: use `aria-live` on the summary only, and let the field errors be read through `aria-describedby`.

## Checked and passing

- **Status vocabulary:** `StatusBadge` maps the six student and three teacher statuses exactly (`app/src/ui/index.tsx:60-68`). Labels used on badges (Draft, Pinned, Unread, Edited, Teacher, Active, Deactivated) are all on the allowed list. No "Due soon" or "Upcoming" badge remains (`DueBadge` is gone).
- **Dates:** `fmtDate` and `fmtDateTime` produce "Fri 17 Oct, 23:59" and drop the year in the current year (`app/src/lib/format.ts:6-16`). Date-times are in `<time dateTime>`.
- **One primary button per screen:** checked on every in-scope page. No page has two `variant="primary"` buttons. The Notifications and Dashboard pages have none, as the rule allows.
- **Delete confirmations:** each destructive delete uses `Confirm`, with a question title, a consequence line, Cancel focused and a verb button. Examples: `Announcements.tsx:106-115`, `Modules.tsx:151-160`, `ThreadView.tsx:134-153`, `People.tsx:87-96`, `admin/Users.tsx:107-116`.
- **Error copy:** most messages follow "what happened, what to do". The file-size message is the model: `Modules.tsx:214`.
- **Topbar:** permanent on every page (`styles.css:92`, no mobile-only class). The "make the topbar permanent" gap is closed.
- **Dialog focus:** first field, or Cancel for confirms, and focus returns to the opener (`app/src/ui/index.tsx:139-161`).
- **Empty states with an action:** Courses, Users, Modules, Announcements, Dashboard, and the People students list show the action where the viewer can act.
- **Loading:** pages show `Loading` instead of an empty state while data loads (for example `Dashboard.tsx:23`, `Notifications.tsx:51`).
- **Forbidden patterns, scanned:** no placeholder-as-label, no tooltips, no hover-only controls, no emoji, no "OK" or "Click here" buttons, and no exclamation marks in UI strings.

## Verdict

0 blockers, 14 should-fix, 11 nits: the in-scope UI follows most of the guideline rules, but the error summaries, label visibility on phones, focus handling and per-row button names need fixing before M3 is called done.

## Responses

Fixed in the `m3-ux-fixes` brief. The same rules were applied to Assignments, AssignmentForm, AssignmentView, Grades, Grading, GradingSubmission and Gradebook.

**Fixed:** S1 (Dashboard link hidden for admins), S2 (bell label stays visible on phones; top bar wraps at 320 px), S4 (44 px on `.btn` and `.nav-link` under 820 px, and on row title links), S5 (inline `outline: none` removed; Notifications moves focus to the h1), S6 (`ErrorSummary` with `role="alert"` and links, on the New user, New course, Link, Assignment and Password forms), S7 (`Select` supports `error` and `hint`; Courses form uses it), S8 ("Required" text beside the label, plus the `required` attribute), S9 (inline `ErrorNote`), S10 (per-row `aria-label`s on Announcements, Modules, ThreadView, People, Grading, Gradebook links), S11 (`Status` live regions on Calendar, Users, Grading), S12 (`useTitle` in `app/src/ui`; every page and the no-access and not-found pages), S13 (demo accounts shown only when `/config.json` reports `demo`, from `SEED_DEMO`; noted in `ia.md`), S14 (hint and disabled Save with a reason when no teacher exists). Nits fixed: N1, N2 (heading and autofocus), N3 (meta says "Opens in a new tab"), N4 (roles shown capitalised), N6, N7, N8, N9, N11 (field errors are no longer individual alerts; three e2e locators moved from `getByRole("alert")` or `getByText` to `.error-text`, assertions unchanged).

**Partly declined:**
- **S3:** Escape now closes the course menu and returns focus to the Menu button. No scrim and no focus trap: below 820 px the menu is an inline disclosure that pushes content down, not a modal panel, so keyboard users can tab past it and trapping them would be wrong. `ia.md:383` still describes a slide-in panel; the orchestrator should update the IA line or ask for the panel.
- **N5:** the empty-state copy (full sentences, with periods) is the wording specified per route in `ia.md` and asserted by the e2e specs, so it stays. The Dashboard "Nothing missing" empty state now uses `Empty`.
- **N10:** admin passwords stay as plain text on purpose: the admin chooses a temporary password and has to read it back to the person. Left as is; a show/hide toggle would add a control the stories do not ask for.
