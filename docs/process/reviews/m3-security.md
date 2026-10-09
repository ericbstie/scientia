# M3 review: security lens

Reviewer: reviewer (lens: security) · Date: 2026-10-09 · Brief: `docs/process/briefs/m3-review.md`

Scope: `supabase/migrations/*.sql`, `app/server.ts`, `supabase/seed.ts`, `docs/decisions/0004–0006`. Read-only. Supporting reads: `docker-compose.yml`, `.env.example`, `Dockerfile`, `supabase/migrate.ts`, `supabase/reset.ts`, `app/src/pages/course/Modules.tsx` (for the upload and link paths). Nothing was run against a live stack (no docker, no git), so requests below are derived from policy and code, not executed. Each request is what a logged-in user would send through the data API.

Counts: **8 blockers, 9 should-fix, 6 nits.**

---

## Blockers

### B1. Anyone can sign up as an administrator
- `supabase/migrations/0003_roles_and_privacy.sql:13-19` takes the account role from `raw_user_meta_data ->> 'role'` at `auth.users` insert.
- `docker-compose.yml:50` sets `GOTRUE_DISABLE_SIGNUP: "false"` and `:58` sets `GOTRUE_MAILER_AUTOCONFIRM: "true"`. `app/server.ts:101` proxies `/auth/v1/*` to GoTrue unchanged.
- Hurt: an anonymous visitor sends `POST /auth/v1/signup` with `{"email":"x@example.com","password":"…","data":{"role":"admin"}}`. The profile row is created with `role = 'admin'` and `is_admin = true` before any confirmation is needed. That account can call `public.admin_users()` (all emails), reads every grade and submission through `is_admin()`, and can enrol anyone.
- Fix: never read role from client-supplied metadata. Default to `student` in the trigger and set `teacher` or `admin` only through the service-role path (`createUser`). Set `GOTRUE_DISABLE_SIGNUP: "true"` for deployments, or add a server-side check.
- Severity: **blocker**.

### B2. Committed JWT secret and service-role key let anyone bypass RLS
- `docker-compose.yml:12-16` (`x-secrets`) and `.env.example` ship a default `JWT_SECRET` and a default `SERVICE_ROLE_KEY`. I checked the committed `SERVICE_ROLE_KEY` with HMAC-SHA256 against the committed `JWT_SECRET`: the signature verifies and the role claim is `service_role`.
- Hurt: anyone who can reach a deployment with the defaults can mint their own service-role JWT. PostgREST (`docker-compose.yml:66-73`) and the storage API both accept it, and it bypasses every policy in `0002` and `0003`.
- ADR 0004 says deployers must override these. Nothing enforces it: the defaults apply silently.
- Fix: refuse to start `migrate`/`web` when `JWT_SECRET`, `SERVICE_ROLE_KEY`, `ANON_KEY` or `POSTGRES_PASSWORD` equal the committed defaults, unless an explicit `SCIENTIA_DEV=1` is set. Generate keys at install time.
- Severity: **blocker**.

### B3. Demo seed runs by default with a known admin password, and wipes accounts
- `supabase/seed.ts:7` sets `DEMO_PASSWORD = "Demo-pass-123"`. `seed.ts:10` creates `admin@scientia.test` with role `admin`.
- `docker-compose.yml` `migrate` service and `.env.example` set `SEED_DEMO=true` by default. `supabase/migrate.ts:27-31` seeds whenever the ledger has no `seed` row.
- `seed.ts:71` runs `delete from auth.users where email not in (...)`, which removes every other account. `seed.ts:101` truncates `courses` and related tables with `cascade`. `supabase/reset.ts:8` calls `seed()` with no guard.
- Hurt: a default `docker compose up` on any reachable host gives the public a working admin login. Anyone who runs `reset.ts` against a database with real data loses all accounts and course data.
- Fix: default `SEED_DEMO` to `false`. Seed only into an empty database (no `profiles` rows), or require an explicit `--demo-destroy` flag for `reset.ts`. Do not delete accounts that are not demo accounts unless that flag is set.
- Severity: **blocker**.

### B4. Students can read content in unpublished modules through the data API
- `supabase/migrations/0002_core.sql:193-194` (`materials_read`) and `:202-203` (`assignments_read`) check only the row's own `published` flag. They do not check `modules.published`, which `modules_read` (`:188-189`) does enforce.
- `supabase/seed.ts:127-128` puts "Mendel and peas" in the unpublished "Week 3: Genetics" module. The material's own `published` defaults to true.
- Hurt: Maya (student, BIO101) sends `GET /rest/v1/materials?course_id=eq.<bio>&select=title,body` and gets the Week 3 body. The UI hides the module, but the policy does not. The same applies to any assignment placed in an unpublished module.
- Fix: add `and (module_id is null or exists (select 1 from public.modules m where m.id = module_id and (m.published or public.is_teacher(m.course_id))))` to both read policies, or a `security definer` helper for it.
- Severity: **blocker**.

### B5. Students can download files attached to unpublished materials
- `supabase/migrations/0002_core.sql:381-382` (`materials_read` on `storage.objects`) allows any course member to read every object under `materials/<course_id>/…`. It does not check the owning material's `published` flag or its module's.
- Hurt: a student lists `POST /storage/v1/object/list/materials` with prefix `<course_id>`, sees the names of files attached to unpublished material, and downloads them. The storage API applies `storage.objects` RLS to listing, so this is expected to work. Not verified live.
- Fix: keep the object path convention, but restrict reads to objects whose material is visible, for example through a `security definer` lookup on `materials.file_path`. Teachers keep full read.
- Severity: **blocker**.

### B6. Uploaded files are served on the app origin with no type restriction (stored XSS)
- `supabase/migrations/0002_core.sql:381-395` checks the bucket and the path only. Neither bucket has `allowed_mime_types`, and nothing else limits the type.
- `app/src/pages/course/Modules.tsx:223` sets `contentType: file.type || "application/octet-stream"`. The browser supplies that value, so a student or teacher can upload `x.html` with `text/html`.
- `app/server.ts:55-62` and `:101-103` proxy `/storage/v1/*` on the same origin as the app and copy the upstream headers unchanged. The gateway adds no `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, or `Content-Disposition: attachment`. Whether storage-api sets safe headers is not verified in this repo.
- Hurt: a student uploads `x.html` as a submission. When the teacher opens the signed link (`createSignedUrls` at `Modules.tsx:40` is the same mechanism), the script runs on the app origin. supabase-js keeps the session in browser storage by default, so the script can take over the teacher's or admin's session and read or change any course.
- Fix: serve storage objects with `Content-Disposition: attachment`, `nosniff` and `Content-Security-Policy: sandbox` set by the gateway, or serve them from a separate origin. Set `allowed_mime_types` on both buckets and derive the content type on the server from an extension allowlist.
- Severity: **blocker**.

### B7. Teacher-entered link URLs render as `javascript:` links
- `app/src/pages/course/Modules.tsx:108` renders `href={i.url ?? "#"}` with no scheme check. `materials.url` (`0002_core.sql:42`) is free text.
- Hurt: a teacher saves a link material with `javascript:…`. Each student who clicks it runs the script on the app origin with the same session-takeover impact as B6. A teacher is a privileged role, so the teacher-to-student boundary matters.
- Fix: allow only `http:`, `https:` and `mailto:` at save time (database check constraint on `materials.url`) and at render time.
- Severity: **blocker** (one-line fix, high impact).

### B8. Authors can undo teacher removal of their own posts
- `0004_reads_edits_removals.sql:17-21` (`replies_moderate`) and `0002_core.sql:238-239` (`threads_modify`) allow an author to UPDATE their own row. The policies do not limit which columns change, so `removed` is writable by the author.
- Hurt: a teacher removes an abusive reply (`removed = true`). The author sends `PATCH /rest/v1/replies?id=eq.<id>` with `{"removed": false}` and the post comes back. The same works for threads.
- Fix: put column-level privileges on `removed`, or split the policy so authors can update `body` only and the `removed` column is changed by teachers alone (for example a trigger that rejects changes to `removed` unless `is_teacher`).
- Severity: **blocker**.

---

## Should-fix

### S1. Teachers can enrol any account in any role, bypassing the student-only rule
- `0002_core.sql:184` (`enrollments_write`) checks only `is_teacher(course_id)`. It does not check `role` or the target account. A teacher's `POST /rest/v1/enrollments` with `{"course_id":…,"user_id":<any profile id>,"role":"teacher"}` adds that account, including admins, teachers of other courses and deactivated accounts, as a course teacher.
- ADR 0006 and `enrol_by_email` (`0003_roles_and_privacy.sql:44-46`) say only student accounts can be enrolled. The direct insert skips that rule.
- Fix: a `with check` that requires `role = 'student'` and a student account, or route all inserts through `enrol_by_email`.

### S2. Grades can be written for any account, and release notifies them
- `0002_core.sql:231-233` (`grades_write`) checks only that the caller is a teacher of the assignment's course. `student_id` is not checked for enrolment. `app_private.on_grade` (`:308-320`) then sends a "Grade released" notification to that account with a course link.
- Hurt: a teacher inserts grades for non-members and releases them, which creates notifications for accounts outside the course.
- Fix: `with check` that `student_id` is an enrolled student of that course.

### S3. Announcements can be attributed to another author
- `0002_core.sql:199-200` (`announcements_write`) has no `author_id = auth.uid()` check. `author_id` defaults to `auth.uid()` (`:54`) but can be set on insert or update.
- Hurt: a teacher posts an announcement that displays as coming from Alex Admin or another teacher. The threads and replies policies already check authorship, so this is an inconsistency.
- Fix: add `author_id = auth.uid()` to the insert and update checks. Apply the same to `grades.graded_by` (`:95`).

### S4. Students can backdate a submission on first insert
- `0002_core.sql:224-225` (`submissions_insert`) does not constrain `submitted_at`. `on_resubmit` (`:353-363`) forces `submitted_at = now()` only on UPDATE, so an insert keeps any timestamp the client sends.
- Hurt: late work on an assignment with `allow_late = true` can be inserted with an earlier `submitted_at`, so it shows as on time. ADR 0005 says lateness is derived from `submitted_at`, so the derived value is wrong.
- Fix: a BEFORE INSERT trigger that sets `submitted_at = now()` and `attempt = 1`, as the update trigger does.

### S5. Threads and replies can be moved into courses the author is not in
- `0002_core.sql:238-239` (`threads_modify`) and `0004:19-21` (`replies_moderate`) have `with check` clauses that verify authorship only. They do not verify membership of the new `course_id` or `thread_id`. Insert policies do check membership (`:236-237`, `:249-250`).
- Hurt: a student changes their thread's `course_id` to a course they are not in, or moves a reply to another course's thread, and the content appears in that course.
- Fix: repeat the membership check (`is_member(course_id)` / `is_member(thread_course(thread_id))`) in the update `with check`, or make `course_id` immutable with a trigger.

### S6. Teachers can probe accounts by email and learn names; deactivated accounts can be enrolled
- `0003_roles_and_privacy.sql:33-52` (`enrol_by_email`). Error messages distinguish "no account" (`:42`), "only students" (`:45`) and "already in this course" with the full name (`:48`). A teacher can confirm any email exists, learn its role, and learn the name of an enrolled student. ADR 0006 is meant to stop email harvesting. The function also does not check `deactivated`.
- Fix: return one generic message for all failure cases. Reject deactivated accounts. Rate-limit the call.

### S7. Deactivation is not enforced by the data layer
- `deactivated` is read by no RLS policy (grep of `supabase/migrations/` finds only the column, its grant and the admin list). `app/server.ts:14-25` (`requireAdmin`) also does not check it.
- Hurt: a deactivated user keeps full data access until their existing JWT expires (`GOTRUE_JWT_EXP: 3600`, `docker-compose.yml:53`). A deactivated admin keeps admin endpoints for the same window. GoTrue's ban only stops sign-in and refresh.
- Fix: check `deactivated = false` in `is_member`, `is_teacher` and `is_admin`, and in `requireAdmin`. Or shorten JWT lifetime. Or ban and revoke sessions through GoTrue's logout endpoint.

### S8. Gateway forwards GoTrue admin routes and sets no security headers
- `app/server.ts:101` forwards every `/auth/v1/*` path, including `/auth/v1/admin/*`, to GoTrue. GoTrue requires a service-role JWT for those routes, so this is not exploitable alone, but the gateway should not expose them.
- `app/server.ts:62` and the static `index` route set no `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` or `Strict-Transport-Security`. This is the same gap as B6 and matters for every page.
- Fix: deny `/auth/v1/admin/*` at the gateway. Add a security-header wrapper to all responses.

---

## Nits

### N1. `revoke … from anon` does nothing for functions
- `0003_roles_and_privacy.sql:65` revokes EXECUTE from `anon`, but PostgreSQL grants EXECUTE to `PUBLIC` by default, so `anon` keeps it. The bodies check `auth.uid()`, so the effect is limited. Revoke from `PUBLIC` explicitly.
- `assignment_course` (`0002_core.sql:217-220`) and `thread_course` (`:243-246`) are `security definer` with no caller check. Any caller who knows a UUID learns its course. UUIDs are hard to guess, so this is low risk.

### N2. Users can rewrite their own notifications
- `0002_core.sql:255-256` (`notifications_mark`) allows any column update on own rows. Only `read_at` should be writable.

### N3. Broad table grants rely entirely on RLS
- `0002_core.sql:261` grants `select, insert, update, delete` on every table to `authenticated`. Policies are the only control. Future tables should get explicit grants, and `anon` should be revoked explicitly on new tables.

### N4. `profiles` read policy depends on column grants
- `0001_profiles.sql:23-24` uses `using (true)`. Email is protected only by the column grant in `0003:10-11`. One later `grant select on public.profiles` would expose emails.

### N5. Admin endpoints interpolate unvalidated path IDs
- `app/server.ts:77` and `:84` put `req.params.id` into upstream URLs and a PostgREST filter with no UUID check. Admin-only, so impact is limited. `server.ts:42` also passes upstream error text to the client.

### N6. Development mode is on unless `NODE_ENV=production`
- `app/server.ts:95` enables Bun development mode by default. `Dockerfile:12` sets production, so the container is fine. Default to production and opt in to dev.

---

## Checked and found sound
- `profiles.email` is hidden from `authenticated` (`0003:10-11`); emails come only from the `security definer` functions, which check caller roles.
- Every `security definer` function sets `search_path = ''`.
- Grades are hidden by policy until `released` (`0002:229-230`). Submissions are readable only by the owner and course teachers.
- `guard_submission` blocks edits after grading and after close (`0002:335-350`).
- Storage `submissions` writes require the caller's own folder and `can_submit`.
- `requireAdmin` fails closed when keys are empty (`server.ts:17-24`).
- `createUser` validates the role against an allowlist (`server.ts:31`).

## Verdict
Not ready for the final metrics run: B1 to B3 (defaults and signup give admin access), B4 to B5 (hidden content leaks), B6 to B7 (session-takeover XSS) and B8 (moderation is reversible) each need a fix and a regression test before M3 is signed off.

## Responses (orchestrator)

| Finding | Outcome |
| --- | --- |
| B1 role from signup metadata | Fixed: trigger dropped (0007), role set by the admin endpoint with the service key; signup disabled in compose |
| B2 committed dev secrets | Declined for the dev defaults (needed for a zero-config `docker compose up`); the server now logs a warning when the development keys are in use, and `.env.example`/ADR 0004 say they must be overridden |
| B3 seed defaults | Partly: the seed runs once on first start only (marker in `app_private.migrations`); `reset.ts` now refuses non-local databases; `SEED_DEMO=false` disables it |
| B4 unpublished module material | Fixed (materials_read checks module_published) |
| B5 storage files of hidden material | Fixed (material_file_visible) |
| B6 uploaded HTML as stored XSS | Fixed: storage responses get `content-security-policy: sandbox; default-src 'none'` and `nosniff` |
| B7 javascript: links | Fixed: DB check constraint + href guard in Modules |
| B8 authors undo moderation | Fixed: guard_post trigger |
| S1–S4, S6, S7 | Fixed in 0007 |
| S5 moving posts | Fixed (guard_post) |
| S8 gateway | Fixed: `/auth/v1/admin` needs the service key; security headers on API responses. The SPA HTML route is served by Bun's HTML import and does not get the CSP header yet (carried forward) |
| N1, N2, N5 | Fixed |
| N3, N4 | Accepted: RLS is the boundary by design (ADR 0005); column grants documented in ADR 0006 |
| N6 | Fixed by the image (`NODE_ENV=production`); dev server is only for development |

Regression tests: `e2e/security.spec.ts`.
