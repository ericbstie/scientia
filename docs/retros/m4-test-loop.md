# Retro: M4 tester loop, rounds 1 to 12

Date: 2026-10-10

The stretch from the M3 retro (0779e04, 2026-10-09 19:03) to round 12 (a974958, 2026-10-10
02:52). The coordinator ran three role threads in a loop: the blind tester filed GitHub issues,
the coordinator routed them (ux and design to the designer, bug and tech to the tech senior),
both fixed on main, and the tester retested. Rounds 11 and 12 came back clean on new scenarios,
so the loop is paused.

## Numbers
`mise run metrics` on 3c3723b (b448439 in history). "M3" is the M3 retro run (06678c3).

| metric | M3 | now | target |
| --- | --- | --- | --- |
| e2e.total | 116 | 131 | — |
| e2e.pass_rate | 100 | 100 | ≥ 100 ok |
| e2e.duration_s | 384.3 | 355.2 | ≤ 360 ok (see "e2e time") |
| a11y.pages_scanned / serious | 71 / 0 | 78 / 0 | ≤ 0 ok |
| design.phone_overflow | — | 0 | ≤ 0 ok (new, #26) |
| bundle.js_kb_gz | 188.4 | 206.3 | ≤ 250 ok (Designsystemet since 22:33) |
| copy.leaks | 0 | 0 | ≤ 0 ok |
| ux.blind_tasks_done_pct | 66.7 | 100 (round 12) | ≥ 100 ok |
| design.overrides | — | 0 | ≤ 0 ok |

Blind first passes, scenarios Done: round 4 6 of 7; round 6 7 of 7; round 7 3 of 5 (not a full
pass); round 8 7 of 7; round 9 7 of 7; round 10 6 of 7 (the release step was refused by the
test harness's permission check, not by the app); rounds 11 and 12 7 of 7 on new scenarios.

## Did earlier retro actions work?
| From | Action | Applied? | Effect in this stretch |
| --- | --- | --- | --- |
| M3 | `ux.blind_tasks_done_pct` from the first-pass table | Yes | It rose 66.7 → 85.7 → 100 and showed which rounds were full passes. Its file choice had to be fixed twice (e2accb7: newest round, not the highest name; b97d4e4: full passes only) |
| M3 | Metrics stop lying (stale report guard) | Yes | No stale `e2e.*` line since. Two new silent errors appeared and were fixed: a checkout older than the bundle patch measured 238 KB, not 206 (5b4a119), and scans of a scrolled page reported a too-small target (d3d92ad) |
| M3 | Contracts proven before dispatch | Not tested | No parallel slices ran in this stretch |
| Designer 2 | `design.overrides`, `design.literal_sizes`, `design.custom_css_lines` | Yes | All stayed at 0, 0 and ≤ 210 through 15 designer fix commits |

## Issues per round
44 issues, #16 to #59: 24 ux, 12 design, 5 bug, 3 tech. 41 closed as fixed, 2 as not planned
(#42, #50), and #33 was fixed (f74f7cd, 21:09) before it was filed (21:28) and stayed open until
this retro closed it. Time is from filing to closing, which happens after the fix is on main.

| Source | Issues | Median to closed | Slowest |
| --- | --- | --- | --- |
| Rounds 1 to 3 | #16 to #25 (10) | 61 min | #16, 196 min (reopened) |
| Coordinator, tooling | #26 | 26 min | — |
| Round 4 | #27 to #30 (4) | 100 min | #28 and #29, 138 min |
| Round 5 | #31, #32 (2) | 57 min | #32, 91 min |
| Redesign review | #33 to #37, #39, #40 (7) | 58 min | #33, fixed before filing, open 5.6 h |
| Tech | #38 (e2e time) | 65 min | — |
| Round 6 | #41 to #44 (4) | 28 min | #44, 167 min (reopened later) |
| Round 7 | #45 to #47 (3) | 8 min | — |
| Round 8 | #48 to #52 (5) | 14 min | #50, 106 min (reopened, closed not planned) |
| Round 9 | #53 to #57 (5) | 13 min | #56, 18 min |
| Round 10 | #58 | 6 min | — |
| Round 11 | #59 | 8 min | — |
| Round 12 | none | — | — |

From round 7 on, median time to closed fell from about an hour to under a quarter of an hour.
The designer and the tech senior took their labels in parallel and pushed within minutes of each
other.

## Reopened, and why
- **#16** (file control): the round 5 retest still saw the browser's own control after the
  first fix. The redesign (ec42005, 6e958e7) replaced it with Designsystemet's upload area.
- **#27** (Release all): reopened in round 5, but the tester had never seen the confirmation.
  `look.ts` printed the page and not the dialog that opened on the last step. The app was right.
  The tool was fixed in c3d84f0.
- **#44** (dashboard section for overdue work), fixed twice. Round 6 found closed work under
  "Missing". The tech fix (e2accb7) renamed the section "Past due", and round 7 passed it. The
  designer's #49 change (afff8dd) gave all overdue work one vocabulary and put "Missing" back on
  the section, so round 9 reopened #44. The final fix (fec2395) lists only work that can still
  be handed in.
- **#50** (late-work line): the round 8 fix removed the line from work not yet due. Round 10
  reopened it because the line still names no cut-off or penalty. The product has neither, so it
  was closed as not planned.
- **#42** (two "Add student" buttons) was not a page bug: `look.ts` printed the page behind an
  open dialog. Closed as not planned with the tool fix in e2accb7.

Three of the five came from words (#16 was a component). The overdue-work words alone took five
issues over four rounds: #30 (round 4), #44 (6), #49 (8), #50 (8) and #58 (10). The tech
senior fixed #44 and the designer fixed #49, each correctly by its own issue. The words only
settled once #49 wrote them into `ui-guidelines.md`.

## Tooling: what it cost and what it saved
| Tool | Cost | Saved |
| --- | --- | --- |
| `scripts/look.ts` | 59 → 148 lines in 7 commits: dialog output (c3d84f0, e2accb7), menu items and typed dates (b97d4e4), refusing ambiguous matches with `in "<text>"` (7d8dfe1, f84486a), element handles and name prefixes (3829c19), the come-back line (this retro) | Before these fixes the tool produced two false findings (#27's reopen, #42) and one wrong click that released Liam's grade in round 8. None since round 8. Rounds 10 to 12 report "the tool did nothing, as designed" where a label was ambiguous or stale |
| `scripts/metrics.ts`, blind tasks | 3 commits, about 25 lines | The number tracks the newest full pass by itself. The round files still said "still reads the round 4 file (85.7)" in rounds 7 to 12, while main read 100 from 23:38 on 10-09. That line cost two coordinator relays and two checks (see change 1) |
| `scripts/metrics.ts`, bundle | 1 commit, 3 lines (5b4a119) | A fresh clone and an older checkout now both measure 206 KB. The designer's sandbox measured 238 KB and asked |
| `e2e/fixtures.ts`, `playwright.config.ts` | 6 commits | #38: reduced motion and axe run in the page cut the suite from 441 s to 275 s on the same sandbox. Scrolling to the top before a scan removed 2 false serious findings. The minified axe build and a cheaper demo-password hash cut 375 s to 355 s (3c3723b) |

## e2e time against the 360 s target
| When | Commit | Tests | Seconds | Note |
| --- | --- | --- | --- | --- |
| 10-09 19:01 | 06678c3 | 116 | 384.3 | M3 retro |
| 19:46 | aaaa991 | 119 | 441.9 | sign-in through the form |
| 20:04 | b8d8a0c | 121 | 325.6 | sign-in through the auth API |
| 21:24 | f927b0c | 128 | 336.7 | |
| 22:33 | 28946d1 | 128 | 440.7 | Designsystemet redesign (#38 filed) |
| 23:38 | 786da01 | 128 | 274.7 | #38 fixed (reduced motion, axe in the page) |
| 10-10 00:20 | 488444b | 129 | 346.9 | different sandbox, about a quarter slower |
| 01:53 | 40c9e40 | 131 | 356.3 | |
| 02:58 | 10e9bb5 | 131 | 375.4 | no new tests; dry run, not in history |
| 03:03 | d540246 | 131 | 355.2 | minified axe, cheaper demo-password hash |

The target was set on the faster sandbox (274.7 s), and the slower one sits at 347 to 375 s with
the same tests. Each test's accessibility scan takes about 0.75 s of its 2.7 s: 0.3 s waiting
for the network to go quiet, 0.17 s loading axe and 0.2 s running it. That is the next place to cut
if the suite grows.

## What worked
- **One issue per finding, routed by label.** Issues closed in minutes from round 7 on, and
  rounds 11 and 12 found nothing new on scenarios the earlier rounds never ran.
- **Retests as their own table.** Retest rows never moved the blind-tasks number, so a fixed
  issue could not raise it by itself.
- **Fixing the tool when it lied.** Every false finding (#27, #42, the round 8 click) became a
  `look.ts` rule that refuses to guess.

## What hurt
- **A copied line outlived its truth.** Each round file started its "Next" section from the
  previous round. Six files (rounds 7 to 12) say the metric "still reads the round 4 file". Root
  cause: the line was written from memory, and the metric never said which file it read.
- **The same words fixed in two places.** Overdue-work wording came up in five issues. Root
  cause: issues were routed by label (bug or tech to tech, ux to the designer), so one
  vocabulary had two owners until #49.
- **Partial runs reach main.** The designer's fix commits ran the specs they touched. After
  afff8dd, the next full run found two serious scan findings. They came from the scan reading a
  scrolled page and were fixed in the scan (d3d92ad), but only a full run could show them. The
  rule to run the full suite already exists; this note is a reminder, not a new change.
- **Testers lost steps to a fresh browser.** In rounds 10, 11 and 12, three testers each round
  sent a second `look.ts` call that assumed the first call's page was still open. The prompts
  say each call starts fresh.
- **A fixed issue nobody closed.** #33 was fixed 19 minutes before it was filed and stayed open
  for 5.6 hours.

## Changes applied
| File | Change | Evidence | Expected effect |
| --- | --- | --- | --- |
| `scripts/metrics.ts`, `.claude/skills/user-test/SKILL.md` | 1. The metric prints the file it read ("ux.blind_tasks_done_pct is read from …"). A round file states the number only by quoting that line from a run on current main | Rounds 7 to 12 repeated a false "round 4 (85.7)" line, and it cost two relays | No round file contradicts the metric |
| `scripts/look.ts` | 2. After every signed-in call that ends away from the dashboard, look.ts prints the `--as … --step 'goto …'` that brings the next call back to that page | Three testers a round in rounds 10 to 12 lost a step | No "lost a step" note in the next round |

## For the coordinator (role briefs, not applied)
3. **One owner for status words.** An issue that changes a status or section word ("Missing",
   "Late", "Closed", "Submitted") goes to the designer whatever its label, and the tech senior
   changes the logic behind it on the designer's issue. Evidence: five issues and one
   regression (#44 after #49) over four rounds, with the words settled only by #49's
   `ui-guidelines.md` entry. Expected effect: no reopen caused by another issue's fix.

## Carried forward
- **#50: what late work costs.** The product owner decides whether late work has a cut-off or
  a penalty. Until then the page says only that late work is accepted and marked late.
- **Round 10's release step** was refused by the harness's permission check and was not re-run.
  Rounds 11 and 12 released grades with no refusal.
- **e2e time** is 355 s against 360 s on the slower sandbox. If new tests push it over, the scan
  is the next place to cut, before the target moves.
