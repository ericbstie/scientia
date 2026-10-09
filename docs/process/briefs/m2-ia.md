# Brief: Information architecture and layout plan

- **Role / model:** analyst / sonnet
- **Milestone:** 2
- **Issue:** #1

## Goal
A layout plan that gives every user story (US-1 to US-43) a home screen and a
shortest path, so M3 implementers build one consistent, minimal UI.

## Inputs
- `docs/stories/*.md` (all stories and the conventions in README.md: top bar, fixed course navigation, statuses)
- `docs/research/synthesis.md` (principles), `docs/research/design-patterns.md`
- Existing design tokens and primitives: `app/src/styles.css`, `app/src/ui/index.tsx` (Button, PageHeader, Section, Empty, Badge, DueBadge, Field, TextArea, Select, Checkbox, Dialog, Toast, Avatar; CSS classes list, row, card, tabs, table-wrap, badge, alert, empty)
- Stack: React SPA with react-router; routes are URLs, so every screen must have a route.

## Allowed to touch
- `docs/design/ia.md` (create)
- `docs/design/ui-guidelines.md` (create)

## Acceptance criteria
- [ ] `ia.md` has a **Site map** (tree of every route with its path, e.g. `/courses/:courseId/assignments/:assignmentId`), and for each route: purpose, who sees it (student/teacher/admin), the main regions top to bottom, primary action, empty state text, and the story ids it serves.
- [ ] `ia.md` has a **Story coverage** table: every US id 1–43 appears exactly once as a row, with the route(s) and the user's path (e.g. "Dashboard → Due soon row → Assignment").
- [ ] `ia.md` has a section headed exactly `## Click budget` containing a Markdown table with columns `| Core task | Clicks |` and one row per core task (sign in to seeing what is due; submit an assignment; read latest feedback; post an announcement; grade the next submission; release grades; create an assignment; find a course's material). The clicks cell is a bare integer counted from the dashboard after sign-in. Every value is ≤ 3; redesign until it is.
- [ ] `ia.md` has a **Responsive** section (what changes under 820 px) and a **Keyboard & screen reader** section (landmarks, skip link, heading order, focus after navigation and after dialogs).
- [ ] `ui-guidelines.md` (max ~150 lines) states the visual and copy rules implementers must follow: layout widths, when to use list rows vs cards vs tables, one primary button per screen, status badge vocabulary (exactly the statuses in stories README), date formatting, empty states, confirmations for destructive actions, error message style (say what happened and what to do), writing tone, and what is forbidden (icons without labels, colour as the only signal, modal-on-modal, toasts as the only error).
- [ ] No new features beyond the stories.

## Return
Under 150 words: files written, route count, click budget values, any story you found ambiguous and how you resolved it.
