# UI guidelines

Rules for implementers. Screens and routes are in `ia.md`; the idea behind the rules is in
[brand.md](brand.md). Build with the components and tokens of Designsystemet
(`@digdir/designsystemet-react`, `@digdir/designsystemet-css`); `app/src/ui/` holds only what
the system does not provide. Never hard-code a colour or size, restyle a component, or write
ad-hoc markup where a component exists.

## Layout

- Page content sits in one column (max 880 px). Gradebook, Grading queue and Admin tables use
  the wide column (max 1160 px). The sign-in card is 420 px.
- Course navigation is 248 px at the left of course pages. The top bar is on every page except
  sign-in. The system has no top bar, navigation or page header; these three are ours and are
  built from `--ds-*` tokens only.
- Spacing only from the system's `--ds-size-*` scale. Sections are separated by the same step
  on every page.
- Every page starts with the page header: optional back link to the parent page (the system's
  `Breadcrumbs` with one link, shown with its chevron; never the course
  code, which the course navigation already shows), one h1 (`Heading`), optional subtitle,
  actions on the right. One h1 per page, h2 for sections, no skipped levels.
- Breakpoint is 820 px. Content stays one column below it.

## Brand

[brand.md](brand.md) holds the idea, the nine rules, where the primary colour goes and the
five page shapes. In short: the system's neutral surfaces, one primary colour in the places
you look, one typeface, one mark. Nothing else carries the identity.

- Name and mark: "Scientia" with the S mark (`BrandMark`) in the top bar and on the sign-in
  card. The top bar is solid accent, the mark and name are in the contrast colour, so it
  follows light and dark.
- Colour: `data-color="accent"` is set once on the root. The accent is for the top bar, the
  current place, the one primary button, links and counts (brand.md has the table).
  Status colours (success, warning, danger) appear only in tags, alerts and delete actions,
  and always with words.
- Typeface: Inter through `--ds-font-family`, using the system's `Heading` and `Paragraph`
  sizes. Heading weights are the system's.
- Tone: plain and direct (see Writing). No exclamation marks, emoji, illustrations or
  decorative motion anywhere. We add no motion of our own; hover, focus and press are the
  component's.

## Tokens and overrides

The theme (generated from the colour inputs in brand.md) is the only place a colour, radius,
shadow or font is chosen. Components and pages use the system's tokens and nothing else.

- Colour `--ds-color-…`, radius `--ds-border-radius-*`, shadow `--ds-shadow-*`, size
  `--ds-size-*`, line height `--ds-line-height-*`, font weight `--ds-font-weight-*`.
  Sizes of components come from `data-size` (`md` everywhere; `sm` in rows and table
  cells), not from a height we set.
- No `style={{ }}` in pages and no `<style>` blocks; no `!important`; no literal colour,
  `px` font size, radius or shadow. A layout that only one page needs goes in our
  stylesheet as a named class, built from tokens, and never touches a component's own
  classes.
- Typeface is Inter, shipped in `app/src/fonts/` so every browser shows the same text. The
  Scientia mark is `BrandMark` in `ui/`; the favicon and the screen shown before the app
  loads (`.boot` in `index.html`) are the same shape.
- Sub-navigation between sibling pages (Settings, Grading filters) is a `nav` of links styled as
  the system's tabs (`.tabs` / `.tab`). Each entry is a page with its own address, so it is a
  link; the system's `Tabs` switches panels inside one page and is used only for that.
- Neutral panels, blue content: lists, tables, form panels and empty states sit on
  `data-color="neutral"` surfaces, and their rows, table body or content go back to
  `data-color="accent"` so links and buttons stay blue. `List`/`Row`, `Panel`, `Empty` and the
  tables do this already; use them rather than a bare `Card`.

## Choosing list rows, cards or tables

- **Lists** (`List` or our row list) for anything a person scans and opens: assignments,
  announcements, notifications, threads, queue entries, module items, roster, Upcoming and
  Missing. Title as the link, meta line under it, status tag and date on the right.
- A list that shows only the first few items (the boxes on the course home) is named for what it holds ("Next due") and links to the full list ("All announcements", "All assignments") at the right of its heading.
- **Cards** (`Card`) only for course tiles on the dashboard and for single panels that hold
  a form or a submission. Never a grid of cards for assignments or announcements. Never a
  card inside a card.
- **Tables** (`Table`) only when the reader compares across two dimensions or many columns:
  Gradebook, student Grades, Admin Users and Courses, the Calendar month grid. Numbers
  right-aligned, header cells scoped, first column sticky when the table scrolls, a soft
  shadow on the side that still has content. On phones a table whose columns are all needed
  turns into stacked rows (each cell has its label); a matrix such as the Gradebook scrolls
  sideways instead.

## Buttons and actions

- At most one primary button (`variant="primary"`) per screen. It is the one thing most people came to do (Submit, Post, Save draft, New assignment). Pages that are only navigation have none.
- Everything else is a secondary button; low-value row actions (Pin, Edit, Remove) are `variant="tertiary"` with `data-size="sm"`. Delete actions use `data-color="danger"` and a confirmation.
- A header with two actions puts the secondary one (Export CSV, Import users) immediately left of the primary one.
- Buttons are verbs in sentence case: "Submit", "Add student". Not "OK", "Yes", "Click here".
- Navigation is a `Link` (a button-styled link when it needs button looks); an action that changes data is a `Button`. A disabled button always shows the reason beside it in text.
- Forms: labels above fields, hints under, errors under. Every field is required unless its label says "Optional" beside it; "Required" is never printed, because most fields would carry it. A required field left empty says what to enter ("Enter a title"). The submit button is at the bottom left, Cancel next to it. Enter submits (in a box that takes a list, Shift+Enter starts a new line and the hint says so). Forms use `noValidate` and the app's own errors, never the browser's bubbles. Dates and prices are never pre-filled with a guess the person did not see.

## Status vocabulary

Status tags (`Tag`, colour via `data-color`) use exactly these words and no others. Colour only reinforces the text.

| Audience | Statuses, with the tag's `data-color` in brackets |
|---|---|
| Student, on an assignment | Not submitted (neutral), Submitted (accent), Late (warning), Missing (danger), Closed (neutral), Graded (success) |
| Teacher, on a submission | Needs grading (warning), Graded (not released) (accent), Released (success) |

- "Graded" appears to a student only after release. Missing is never a zero.
- Work that is overdue has one name per state, on every page: **Missing** (the due date has passed, nothing is handed in, and it still takes work), **Closed** (the same, and it no longer takes work), **Late** (handed in after the due date; "Late by 1 day" beside a submission on the teacher's screens, "Submitted 1 day late" on the student's page). "Past due", "Overdue" and "Submit late" are not used. The action is always "Submit", before and after the date. The Dashboard lists only Missing work, because that is the work a student can still act on: Closed work stays on the Assignments and Grades pages, with its tag.
- A line about late work appears only where it limits the person. A student sees "Late work: Not accepted after the due date" until that date passes. Where late work is accepted nothing is said before the date; after it the status says Missing and the note above the open form says what to do: "The due date has passed. You can still hand this in; it will be marked late." (or "Submitting again will mark your work late." when something is already handed in) The teacher sees the setting on every assignment. Late work has no cut-off or penalty to state, and the interface does not invent one.
- Labels that are not statuses may appear next to them, and only these: Draft, Pinned, Unread, Edited, Teacher, Active, Deactivated, "Late by 1 day". Gradebook cell text follows US-32: score, "Not released", "Released", "Late, needs grading", "Needs grading", "Missing". "Edited" also tags work that was handed in again; the number of attempts is not shown.

## Dates, numbers and times

- Format `ddd D MMM, HH:mm`, 24-hour, viewer's time zone: `Fri 17 Oct, 23:59`. Date only: `Fri 17 Oct`. Add the year only when it is not the current year (`Fri 17 Oct 2027, 23:59`).
- Relative text ("in 2 days", "7 days ago") may follow in muted text, never replace the date. Always render in `<time dateTime>`.
- Scores are `86 / 100` and always sit beside the label "Score" (a fact on the assignment page, a column in tables); percentages one decimal (`87.3%`); no score is shown as an en dash only inside a gradebook cell, elsewhere as words ("Awaiting grade").
- A total is the last row of the table it adds up, labelled "Total", with what it counts under the label ("2 of 4 assignments graded so far"). It is never a sentence above the table that can be read as one grade.
- Where rows from several courses are mixed (Dashboard, Calendar, Notifications), each names its course by its code ("BIO101"), the same short name as on the course cards. The full title is on the course's own pages.
- Points read "50 points" in text, "(50)" only in table headers and CSV.

## Empty states

- Use `Empty`: a short title that says what is missing and one sentence that says what happens next. It has no button: the page header already holds the create action in its fixed place, and a second button with the same name only gives people two things to choose between. The wording is in `ia.md` per route.
- An empty list never renders a bare table or blank space. Do not use illustrations or humour.

## Confirmations and undo

- Confirm in a `Dialog` (modal) before: delete (announcement, module item, thread, post), remove a student, deactivate a user, withdraw a release, release all.
- Title is a question naming the object ("Delete the announcement 'Field trip'?"). Body says what will happen to others ("Students will no longer see it. This cannot be undone."). Buttons: Cancel (focused) and a verb ("Delete", "Remove"), never "OK". Release all states the count.
- An action offered on a list row is offered on the item's own page too, with the same label and the same confirmation (Release and Withdraw on the Grading list and on a grade's page). A person who finds the item through either route can undo what they did.
- A page whose state decides who can see something (a grade, released or not) says so in one sentence under its heading: who can see it now, and what the button that changes it does ("Withdraw hides the grade again"). The button is never left to be guessed from its label.
- Not confirmed: publish, unpublish, pin, save, submit (these are reversible or non-destructive).
- A hand-in is the one action not confirmed by a toast: the form it came from disappears, so the confirmation is a success note above the submitted work ("Your work is handed in."), which stays until the person leaves the page. Under the work, the page says what can still be done ("You can edit it until your teacher starts grading.").
- Any other completed action shows a short toast ("Saved", "Announcement posted"). Toasts confirm; they never carry errors or the only copy of important information. They sit at the top centre, never over a control, and do not take clicks.

## Errors

- Say what happened and what to do, in plain words, with the real limit or name: "The file is 11 MB. The limit is 10 MB. Choose a smaller file." Not "Upload failed" or "Invalid input".
- Field errors sit under the field (`Field` with a validation message), are linked with `aria-describedby`, and the first invalid field gets focus. Two or more errors also get an `ErrorSummary` above the form.
- Server and network errors go in an `Alert` with `data-color="danger"` above the action ("Could not save. Check your connection and try again."), keep the user's input, and never clear the form.
- A closed assignment, a missing account and a wrong role each have their own message; never a generic failure. Sign-in failures use one message that does not say which field was wrong.
- Loading uses `Loading`; do not flash empty states while data is loading.

## Writing

- Plain, direct, sentence case. Speak to the user as "you" ("Your teacher has started grading this work"). Short sentences, no exclamation marks, no emoji, no jargon (no "LMS", "asynchronous", "instance").
- Name things as the stories do: Modules, Announcements, Discussions, Grading, Gradebook, People, Dashboard, Upcoming, Missing. One term per concept; do not call a course "class" or a thread "topic".
- Link text says where it goes ("Open the grading queue"), never "here".
- Teachers see the same words as students wherever the object is the same.

## Copy: only what the user needs

- Every visible string (labels, headings, page titles, empty states, hints, errors, the `<title>`) must help the person do their task. If removing it would not confuse anyone, remove it.
- Never mention other products (no competitor names anywhere in the interface), how or why the product was built ("minimal", "design-focused", "intuitive", "calm"), internal process (story ids, "demo data", milestones) or marketing claims.
- Name things in the user's words, as found by blind user tests (`.claude/skills/user-test/SKILL.md`), not ours.
- `mise run metrics` counts forbidden terms in `app/` as `copy.leaks` (target 0).

## Forbidden

- Icons without a visible text label (decorative icons are `aria-hidden` and sit next to text). The bell shows the word "Notifications" and its count.
- Colour as the only signal for status, errors, required fields, today on the calendar or unread items.
- A dialog opened from a dialog; a dialog used for a form with a textarea.
- A toast as the only place an error appears.
- Hover-only controls, tooltips holding required information, placeholder text as a label, auto-playing motion.
- Hidden navigation: the course navigation and top bar are always visible (collapsed behind a "Course menu" button, with a menu icon, below 820 px only).
- Settings, filters, columns or fields beyond the stories.
- Text smaller than the system's smallest body size, targets smaller than 24 by 24 CSS px (aim for 44 px on touch), removing the focus outline.
- Overriding a component: its colour, size, radius, shadow or type, `!important`, selectors on its own classes. Change the page or the theme input instead (brand.md).
