# Brief: Revise stories after review

- **Role / model:** analyst / sonnet
- **Milestone:** 2

## Goal
Make every story deterministic and testable against the real seed, applying the two reviews.

## Inputs
- `docs/process/reviews/m2-stories-testability.md`, `docs/process/reviews/m2-stories-research-fit.md`
- `supabase/seed.ts`: **the source of truth for demo data** (text, timestamps, files). Stories and README must match it exactly; where a story needs data the seed lacks, prefer rewriting the criterion over asking for new seed data. If seed data is truly required, list it under "Seed changes requested" at the end of README.md (the orchestrator owns seed.ts).
- `e2e/fixtures.ts`: reseed mechanism (`reset()`), `signIn`, automatic axe scan at the end of every test (so accessibility of every visited page, teacher pages included, is already checked). Fixture files are `e2e/files/sample.pdf` and `e2e/files/too-large.bin` (not `e2e/fixtures/`).
- Orchestrator decisions (apply, do not relitigate):
  - "Due date changed" notification stays: a due date change is a meaningful event, not a cosmetic edit. Reword synthesis principle 3 to "never for cosmetic edits".
  - All five notification kinds default on; calm comes from only having five meaningful kinds. Say so in synthesis.
  - Gradebook CSV export is a client-side download; tests use Playwright's download event, not a URL.
  - Authorisation checks against the data API use `/rest/v1/<table>` with the signed-in user's token (e.g. a student requesting `/rest/v1/grades` sees only their own released grades).
  - Time: the browser runs in UTC with locale en-GB; dates in criteria are relative to the seed run ("due in 2 days"), never absolute calendar dates or months. Calendar tests navigate by "Next"/"Previous" rather than naming months.
  - Size limit for uploads: 10 MB per file.
  - Add to synthesis "Later": announcement expiry/archiving, performance budget beyond bundle size.
  - US-9: add a criterion that typed text is kept when a submission fails.
  - US-21: include the phone dashboard (what's due) check.

## Allowed to touch
- `docs/stories/*.md`, `docs/research/synthesis.md`

## Acceptance criteria
- [ ] Every blocker and should-fix in both reviews is either fixed or answered in a short "Review responses" table at the end of README.md (finding id → fixed / declined + reason).
- [ ] Every value a criterion asserts (titles, texts, scores, counts, names) exists in `supabase/seed.ts` or is created earlier in the same test.
- [ ] README "Demo data" matches `supabase/seed.ts` (including announcement/notification/submission relative times) and says tests that change data call `reset()` from `e2e/fixtures.ts` in `beforeEach`.
- [ ] Story ids and headings unchanged (`### US-<n> <title>`, US-1..US-43), still 2–5 criteria each.

## Return
Under 150 words: what changed, counts of fixed/declined findings, any seed changes requested.
