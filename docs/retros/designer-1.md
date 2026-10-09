# Retro: Designer 1 — brand audit and first fixes

Date: 2026-10-09

## Numbers
`bun run scripts/metrics.ts` on the rebased tree. "Before" is the last line in
`metrics/history.jsonl` (b09e093, tech's lean pass); the three `design.*` rows are new,
so their "before" was measured by running the same counts on 18a69ed.

| metric | before | after | target |
| --- | --- | --- | --- |
| e2e.pass_rate | 100 (119 tests) | 100 (119 tests) | ≥ 100 ok |
| a11y.serious | 0 | 0 (71 pages) | ≤ 0 ok |
| bundle.js_kb_gz | 166.1 | 165.2 | ≤ 250 ok |
| ux.max_clicks_to_core_task | 3 | 3 | ≤ 3 ok |
| copy.leaks | 0 | 0 | ≤ 0 ok |
| design.inline_styles | 36 | 0 | ≤ 0 ok (new) |
| design.font_sizes | 10 | 5 | ≤ 5 ok (new) |
| design.literal_colors | 4 | 0 | ≤ 0 ok (new) |

## What worked
- **Looking at every page first.** Screenshots of every page, three roles, light, dark and
  390 px wide, turned "make it consistent" into a list of 24 findings that could be fixed
  and re-checked. Three were already in the user tester's issues.
- **Tokens before components.** One type scale, one set of control heights, radii, shadows
  and a brand mark in `styles.css` made the later fixes one-line changes. Inline styles
  went from 36 to 0 and font sizes from 10 to 5.
- **One rule per pattern.** Optional fields say "Optional" and nothing else (no "Required"
  anywhere), empty states are a title and one sentence, back links read "‹ Parent", the
  eyebrow is never a course code. Each is a line in `ui-guidelines.md`, so the next page
  follows it without a discussion.

## What hurt
- **Phone breakage passed every test.** A dashboard row squeezed its title to 40 px,
  admin tables hid Role and Actions, the header split into two rows. All 116 e2e tests and
  every metric were green, because e2e runs at desktop width only. Root cause: nothing in
  the process looks at a narrow screen; only a person (the user tester) did.
- **A stale server gave a false result.** After checking out a new commit in the
  verification worktree, the old server still held the port, so a full e2e run tested old
  code with new specs and failed on copy that had already changed. Root cause: restarting
  was manual and its failure was silent. Fix applied by tech (`slot.sh` stops by pid);
  the habit that remains is to `curl` the page and check for the new markup before a run.
- **Rebasing onto a fast-moving main cost two stale specs.** Tech added a spec that selects
  "Select a teacher" while the designer's copy fix renamed the option. A second spec checked
  that Liam's closed assignment read "Missing", which only held because the Grades score
  column repeated the status in a different word; removing that duplicate (issue #17) made
  the row say "Closed" once, as the status vocabulary says. Both were correct on their own
  branches. Copy changes need a grep over `e2e/` at rebase time, not just at commit time,
  and a spec should assert the status badge, not a side effect of another column.

## Changes applied
| File | Change | Expected effect (metric) |
| --- | --- | --- |
| `scripts/metrics.ts`, `metrics/targets.json` | `design.inline_styles`, `design.font_sizes`, `design.literal_colors` | A new inline style, a sixth font size or a hex colour in a page fails the target the same day |
| `docs/process/metrics.md` | Three rows for the new metrics | The metrics stay documented |
| `docs/process/WORKFLOW.md` | Rule "Layout is looked at on a phone" | Phone-only breakage is found by the author, not by a later tester |

## Carried forward
- The stylesheet is 81 KB because the bundler inlines the Inter file as base64.
  `bundle.js_kb_gz` counts JavaScript only, so this does not show. If first-load time
  becomes a concern, count the CSS too before changing how the font is served.
- Phone width is not measured. A check that no page scrolls sideways at 390 px belongs in
  the a11y scan, which already visits 71 pages; that is a test change, so it goes to the
  tech senior as an issue rather than into this retro.
- The Gradebook total and the student's Grades total can differ when work is ungraded
  (issue #8). The copy now says "Graded so far"; whether the teacher's total counts
  ungraded work as zero is a product decision.
