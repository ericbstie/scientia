# Brief: <short task name>

- **Role / model:** <role> / <model from roles.md; opus, effort high, if it changes files>
- **Milestone:** <1|2|3>
- **Issue:** #<n> (if any)

## Goal
One or two sentences: what exists when this is done, and why.

## Inputs
Files, links and decisions the agent must read first.

## Allowed to touch
Exact paths or globs. Anything else is off limits; ask in the report instead.
A missing schema, RLS policy, RPC or shared helper is a blocker, not a puzzle:
stop that part, report the exact change needed, and leave that test failing.
Never emulate it in the client (no probe writes, no data hidden in other columns or storage).

## Acceptance criteria
- [ ] Checkable statement (a command passes, a file contains X, a story id is covered)
- [ ] …

## Return
What the report must contain: files changed, how each criterion was verified,
open questions. Keep it under 200 words unless the brief asks for a document.
