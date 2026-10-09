# UI guidelines

Rules for M3 implementers. Screens and routes are in `ia.md`. Use the tokens in `app/src/styles.css` and the primitives in `app/src/ui/index.tsx`; never hard-code colours, sizes or ad-hoc markup where a primitive exists.

## Layout

- Page content sits in `.content` (max 880 px). Gradebook, Grading queue and Admin tables use `.content.wide` (max 1160 px). Sign-in card is 420 px.
- Course navigation is 248 px (`--sidebar`) at the left of course pages. Top bar is on every page except sign-in.
- Spacing only from the scale `--s1` to `--s7` (4, 8, 12, 16, 24, 32, 48 px). Sections are separated by `--s6`.
- Every page starts with `PageHeader`: optional eyebrow (course code or a "‹ Parent" back link), one h1, optional subtitle, actions on the right. One h1 per page, h2 for sections, no skipped levels.
- Breakpoint is 820 px. Content stays one column below it.

## Choosing list rows, cards or tables

- **List rows** (`.list` with `.row`) for anything a person scans and opens: assignments, announcements, notifications, threads, queue entries, module items, roster, Upcoming and Missing. Title as the link (`.row-title`), meta line under it, status badge and date on the right.
- **Cards** (`.card`, `.course-card`) only for course tiles on the dashboard and for single panels that hold a form or a submission. Never a grid of cards for assignments or announcements. Never a card inside a card.
- **Tables** (`.table-wrap` plus `table`) only when the reader compares across two dimensions or many columns: Gradebook, student Grades, Admin Users and Courses, the Calendar month grid. Numbers right-aligned (`td.num`), `th scope`, first column sticky when the table scrolls.

## Buttons and actions

- At most one primary button (`variant="primary"`) per screen. It is the one thing most people came to do (Submit, Post, Save draft, New assignment). Pages that are only navigation have none.
- Everything else is the default (secondary) button; low-value row actions (Pin, Edit, Remove) are `ghost` and `small`. Delete actions use `danger` text colour and a confirmation.
- Buttons are verbs in sentence case: "Submit", "Save draft", "Add student". Not "OK", "Yes", "Click here".
- Navigation is a link (`ButtonLink` when it needs button styling); an action that changes data is a `Button`. A disabled button always shows the reason beside it in text.
- Forms: labels above fields, hints under, errors under. The submit button is at the bottom left, Cancel next to it. Enter submits.

## Status vocabulary

Status badges use exactly these words and no others. Colour only reinforces the text.

| Audience | Statuses | Tone |
|---|---|---|
| Student, on an assignment | Not submitted (neutral), Submitted (accent), Late (warning), Missing (danger), Closed (neutral), Graded (success) | as listed |
| Teacher, on a submission | Needs grading (warning), Graded (not released) (accent), Released (success) | as listed |

- "Graded" appears to a student only after release. Missing is never a zero.
- Labels that are not statuses may appear next to them, and only these: Draft, Pinned, Unread, Edited, Teacher, Active, Deactivated, "Late by 1 day", "Past due". Gradebook cell text follows US-32: score, "Draft", "Released", "Late, not graded", "Missing".
- `DueBadge` must be changed to this vocabulary: drop "Due soon" and "Upcoming" (show the date instead) and say "Late", not "Submitted late".

## Dates, numbers and times

- Format `ddd D MMM, HH:mm`, 24-hour, viewer's time zone: `Fri 17 Oct, 23:59`. Date only: `Fri 17 Oct`. Add the year only when it is not the current year (`Fri 17 Oct 2027, 23:59`). Update `fmtDateTime` to match.
- Relative text ("in 2 days", "7 days ago") may follow in muted text, never replace the date. Always render in `<time dateTime>`.
- Scores are `86 / 100`; percentages one decimal (`87.3%`); no score is shown as an en dash only inside a gradebook cell, elsewhere as words ("Awaiting grade").
- Points read "50 points" in text, "(50)" only in table headers and CSV.

## Empty states

- Use `Empty`: a short title that says what is missing, one sentence that says what happens next, and the action button when the viewer can act. The wording is in `ia.md` per route.
- An empty list never renders a bare table or blank space. Do not use illustrations or humour.

## Confirmations and undo

- Confirm in a `Dialog` before: delete (announcement, module item, thread, post), remove a student, deactivate a user, withdraw a release, release all.
- Title is a question naming the object ("Delete the announcement 'Field trip'?"). Body says what will happen to others ("Students will no longer see it. This cannot be undone."). Buttons: Cancel (focused) and a verb ("Delete", "Remove"), never "OK". Release all states the count.
- Not confirmed: publish, unpublish, pin, save, submit (these are reversible or non-destructive).
- A completed action shows a short toast ("Saved", "Announcement posted"). Toasts confirm; they never carry errors or the only copy of important information.

## Errors

- Say what happened and what to do, in plain words, with the real limit or name: "The file is 11 MB. The limit is 10 MB. Choose a smaller file." Not "Upload failed" or "Invalid input".
- Field errors sit under the field (`Field` error prop), are linked with `aria-describedby`, and the first invalid field gets focus. Two or more errors also get a `role="alert"` summary above the form.
- Server and network errors go in an `.alert.danger` above the action ("Could not save. Check your connection and try again."), keep the user's input, and never clear the form.
- A closed assignment, a missing account and a wrong role each have their own message; never a generic failure. Sign-in failures use one message that does not say which field was wrong.
- Loading uses `Loading`; do not flash empty states while data is loading.

## Writing

- Plain, direct, sentence case. Speak to the user as "you" ("Your teacher has started grading this work"). Short sentences, no exclamation marks, no emoji, no jargon (no "LMS", "asynchronous", "instance").
- Name things as the stories do: Modules, Announcements, Discussions, Grading, Gradebook, People, Dashboard, Upcoming, Missing. One term per concept; do not call a course "class" or a thread "topic".
- Link text says where it goes ("Open the grading queue"), never "here".
- Teachers see the same words as students wherever the object is the same.

## Forbidden

- Icons without a visible text label (decorative icons are `aria-hidden` and sit next to text). The bell shows the word "Notifications" and its count.
- Colour as the only signal for status, errors, required fields, today on the calendar or unread items.
- A dialog opened from a dialog; a dialog used for a form with a textarea.
- A toast as the only place an error appears.
- Hover-only controls, tooltips holding required information, placeholder text as a label, auto-playing motion.
- Hidden navigation: the course navigation and top bar are always visible (collapsed behind a labelled "Menu" button below 820 px only).
- Settings, filters, columns or fields beyond the stories.
- Text smaller than 0.78 rem, targets smaller than 24 by 24 CSS px (aim for 44 px on touch), removing the focus outline.

## Gaps in existing primitives to fix in M3

- Top bar: `.topbar` is mobile-only today; make a permanent banner and move the logo out of the sidebar.
- `Field` and `TextArea`: error text needs an id, `role="alert"` and an `aria-describedby` link; `TextArea` lacks an `error` prop.
- `Dialog`: on open focus the first field (Cancel for confirm dialogs); restore focus to the opener on close.
- `fmtDateTime`, `DueBadge`: see Status vocabulary and Dates above.
- Add a focus-on-h1 hook used by `PageHeader` on every route change.
