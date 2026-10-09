# Brief: Review user stories (run with two lenses)

- **Role / model:** reviewer / haiku (×2: lens "testability", lens "research fit")
- **Milestone:** 2

## Goal
Independent check that the stories are buildable and testable (testability lens), and that they address the evidenced pain points without gaps (research fit lens).

## Inputs
- `docs/stories/*.md`, `docs/research/synthesis.md`, `docs/research/*.md`

## Allowed to touch
- `docs/process/reviews/m2-stories-<lens>.md` (create)

## Acceptance criteria
- [ ] Each finding has: story id, the exact criterion text, the problem, severity (blocker / should-fix / nit), a proposed rewrite.
- [ ] Testability lens: flags criteria that a Playwright test cannot check deterministically against the seed (vague words, time-dependent values, data not in the seed, two stories testing one behaviour).
- [ ] Research-fit lens: lists each "top 10 pain point" in synthesis.md and which story ids address it; flags any pain point with no story and any story with no evidence.
- [ ] Ends with a one-line verdict.

## Return
The path written and the count of blockers / should-fix / nits.
