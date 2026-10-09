# 0004 Stack topology: self-hosted Supabase behind the Bun web server

Date: 2026-10-09 · Status: accepted

## Context
`docker compose up` must give a working product with no cloud accounts. Supabase's
official self-hosted stack has ~12 services (Kong, Studio, Realtime, Analytics…),
most of which Scientia does not need.

## Decision
Run only what the product uses:

| Service | Image | Role |
| --- | --- | --- |
| db | supabase/postgres | Postgres with Supabase roles and auth/storage schemas |
| auth | supabase/gotrue | Email + password sign-in, JWTs |
| rest | postgrest/postgrest | Data API, enforced by row-level security |
| storage | supabase/storage-api | Course files and submission uploads (file backend) |
| migrate | built from this repo | One-shot: SQL migrations, then demo seed |
| web | built from this repo | Serves the SPA and proxies `/auth/v1`, `/rest/v1`, `/storage/v1` |

The Bun server replaces Kong as the gateway. The browser talks to one origin,
so there is no CORS setup, and `supabase-js` is pointed at `window.location.origin`.
The anon key is served at runtime from `/config.json`, so one image works with any keys.
Admin-only operations that need the service key (creating users) are Bun
endpoints that verify the caller's JWT and admin flag first.

## Consequences
- No Studio or Realtime. Updates are fetched on navigation; live updates are a later concern.
- Local defaults (JWT secret, keys, DB password) are in `docker-compose.yml` and `.env.example`; anyone deploying must override them.
- Sandboxes behind TLS-inspecting proxies use `docker-compose.sandbox.yml` to pass a CA to the build.

## Alternatives considered
Full Supabase compose (heavy, slow to start, more to break); Supabase CLI `supabase start` (needs the CLI and Docker-in-Docker style management, not plain compose).
