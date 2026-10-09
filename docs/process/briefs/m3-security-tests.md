# Brief: Security regression tests

- **Role / model:** task-worker / haiku
- **Milestone:** 3

## Goal
One spec, `e2e/security.spec.ts`, that proves the fixes in `supabase/migrations/0007_security_hardening.sql` and `app/server.ts` hold, using direct API requests with real user tokens.

## Inputs
- `docs/process/reviews/m3-security.md` (B1–B8, S1–S8), `supabase/migrations/0007_security_hardening.sql`, `app/server.ts`, `e2e/fixtures.ts`, `supabase/seed.ts`
- Get a token: `POST /auth/v1/token?grant_type=password` with header `apikey` = the anon key from `GET /config.json`, body `{email, password}`; then call `/rest/v1/...` with `apikey` and `Authorization: Bearer <access_token>`. Use Playwright's `request` fixture.

## Allowed to touch
- `e2e/security.spec.ts` (create)

## Acceptance criteria
- [ ] Tests titled `@US-43 security: <what>` for: signup is disabled (POST /auth/v1/signup fails); `/auth/v1/admin/users` without the service key returns 404; a student cannot read materials of the unpublished "Week 3: Genetics" module (`/rest/v1/materials?title=eq.Mendel and peas` returns `[]` for Maya, one row for Ingrid); a material link with `javascript:` URL is rejected on insert by Ingrid; Liam cannot set `removed=false`… (create a reply as Liam, remove it as Ingrid via PATCH removed=true, then Liam PATCH removed=false fails); Ingrid cannot insert an enrollment with role teacher; Ingrid cannot write a grade for Priya (not enrolled); Ingrid cannot post an announcement with author_id = Liam's id; Maya's new submission has a server `submitted_at` even if she sends `submitted_at: "2000-01-01T00:00:00Z"`; storage responses carry `content-security-policy` containing `sandbox`; every API response carries `x-content-type-options: nosniff`.
- [ ] `reset()` in `beforeEach`.
- [ ] `bunx tsc --noEmit` passes and `bunx playwright test e2e/security.spec.ts` passes on slot 6 (`scripts/slot.sh up 6`; then `eval "$(scripts/slot.sh env 6)"; export PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`). Run `scripts/slot.sh down 6` at the end.

## Return
Pass line and any check that failed (which means a real security bug: describe the request and response; do not weaken the test).
