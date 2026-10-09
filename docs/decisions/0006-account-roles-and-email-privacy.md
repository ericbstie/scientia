# 0006 Account roles and email privacy

Date: 2026-10-09 · Status: accepted

## Context
Admins need to see each account as student, teacher or admin (US-38/39), while
course roles stay per course (ADR 0005). Students must not be able to harvest
other people's emails through the data API (US-43).

## Decision
- `profiles.role` (student | teacher | admin) is the account type; `is_admin` is now generated from it. Only student accounts can be enrolled by teachers.
- `profiles.email` is not selectable by `authenticated`. Emails reach the UI only through `security definer` functions: `course_people(course)` (emails for the course's teachers), `enrol_by_email(course, email)` (with the exact user-facing error messages) and `admin_users()` (admins).
- A user's own email comes from their session, not the profiles table.

## Consequences
`select=*` on profiles fails for normal users; always list columns.
