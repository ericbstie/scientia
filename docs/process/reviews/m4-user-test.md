# Post-M3 blind user test (re-run)

Run on 2026-10-09 by the user-tester thread (browser only, no code) against `main`
at `b09e093`, after the admin course-management fixes.

## Think-aloud scenario tests

Only the scenario that failed in [m3-user-test.md](m3-user-test.md) was run again.
The other five results are carried over from M3 and say so; they count until a later
run replaces them.

| Scenario | Result | Commands |
| --- | --- | --- |
| Maya: find what is due next and hand in a typed answer | Done (carried over from M3) | 5 |
| Liam: read feedback, see standing, read latest announcement | Partly (carried over from M3; Liam has no released grade in the demo data, so the premise was wrong) | 10 |
| Noah, on a phone: find missed work, check if it can still go in, ask in Discussions | Done (carried over from M3) | 11 |
| Ingrid: post an announcement, add a link to this week's module, set new work | Done (carried over from M3) | 9 |
| Ingrid: grade and release one submission, then find who is behind | Done (carried over from M3) | 8 |
| Admin: give a new teacher an account, create a course for him, enrol Maya | Done (re-run: account, course with that teacher, student added from the course's People page; the student sees the course and the teacher sees the student) | not counted |

## Findings

| # | Finding | Change |
| --- | --- | --- |
| 1 | Adding an unknown email as an admin said "Ask an administrator to create one" (#25) | Admins are told to create the account on the Users page first |

## Next

Run the feedback scenario again with a student who has a released grade (Maya), so
the carried-over Partly is replaced by a real result.
