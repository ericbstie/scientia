# Scientia

A minimal, clearly designed replacement for Blackboard: students hand in work and
follow their courses; teachers publish material, collect work and grade.

## Run it

```sh
docker compose up        # whole stack on http://localhost:3000
mise install && mise run install
mise run e2e             # Playwright against the running stack
mise run metrics         # quality metrics, see docs/process/metrics.md
```

## Where things are

- `app/` web app (React, served and bundled by Bun). `app/server.ts` serves the
  SPA and proxies `/auth/v1`, `/rest/v1`, `/storage/v1` to Supabase services.
- `supabase/migrations/` SQL schema with row-level security; `supabase/seed.ts`
  demo data. Applied by the `migrate` compose service.
- `e2e/` Playwright specs, one per user story, titled with `@US-<n>`.
- `docs/process/` how agents work together; `docs/decisions/` ADRs;
  `docs/research/`, `docs/stories/`, `docs/design/` product definition.

## Rules

- No unit tests. Behaviour is covered by e2e specs per user story.
- Every table has RLS. The browser only holds the anon key and the user's JWT.
- Keep the UI minimal: use `app/src/ui/` components and the tokens in
  `app/src/styles.css`; follow `docs/design/ui-guidelines.md`.
- Push to `main`; never deploy.
- Process changes go through a retro (`.claude/skills/retro/SKILL.md`).
