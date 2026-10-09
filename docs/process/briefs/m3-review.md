# Brief: Review M3 code (run per lens)

- **Role / model:** reviewer / haiku (lenses: "security", "ux-guidelines")
- **Milestone:** 3

## Goal
Independent findings on the merged app before the final metrics run.

## Inputs
- security lens: `supabase/migrations/*.sql`, `app/server.ts`, `supabase/seed.ts`, `docs/decisions/0004–0006`
- ux-guidelines lens: `docs/design/ui-guidelines.md`, `docs/design/ia.md`, `app/src/pages/**`, `app/src/App.tsx`, `app/src/ui/index.tsx`

## Allowed to touch
- `docs/process/reviews/m3-<lens>.md` (create)

## Acceptance criteria
- [ ] Each finding: file:line, what is wrong, the realistic way it hurts a user (security: who can do what they should not, with the concrete request), severity (blocker / should-fix / nit), suggested fix.
- [ ] security lens checks at least: every table has RLS and correct policies for student/teacher/admin; storage policies; security definer functions (search_path, authorisation checks); server endpoints' auth; secrets/defaults.
- [ ] ux-guidelines lens checks at least: status vocabulary, one primary button per screen, empty states, confirmations for destructive actions, error message style, date format, forbidden patterns.
- [ ] No finding without evidence. Ends with a one-line verdict.

## Return
Path written and counts by severity.
