# 0005 Data model and row-level security

Date: 2026-10-09 · Status: accepted

## Decision
- One role per person per course (`enrollments.role`: teacher | student). A global `profiles.is_admin` flag for administrators. Admins pass every teacher check.
- Content: `modules` hold ordered `materials` (page, file, link). Assignments may sit in a module so the course outline is one list.
- Work: `assignments` → one `submissions` row per student (resubmission updates it and bumps `attempt`) → one `grades` row per student with `released`. Students can only read released grades: hidden grades are enforced in the database, not the UI.
- Late is derived (`submitted_at > due_at`), never stored. `allow_late = false` closes submission at the due time, enforced by RLS (`can_submit`).
- A teacher can give one student a later date on one assignment (`extensions`, US-45). `due_for(assignment, student)` returns the later of the two dates, and late, missing and closing all use it; the app reads a student's own date as `my_due_at`.
- Notifications are rows created by triggers on four events only (announcement, assignment published, grade released, reply to your thread). In-app only, with per-course mute. This is the calm default from the research.
- Every table has RLS. Membership checks go through `security definer` helpers (`is_member`, `is_teacher`, `is_admin`) to avoid recursive policies.
- Files live in two private buckets with path conventions checked by storage policies: `materials/<course>/…`, `submissions/<assignment>/<student>/…`.

## Consequences
Authorisation is testable through the UI alone: an e2e test that a student cannot see an unreleased grade proves the policy, not just a hidden button.
