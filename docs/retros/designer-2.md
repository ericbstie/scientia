# Retro: Designer 2 — brand rules for the Designsystemet redesign

Date: 2026-10-09

## Numbers
`bun run scripts/metrics.ts` on 28946d1 plus the metric changes below. "Before" is the last
line in `metrics/history.jsonl` (the redesign's own run); the three new `design.*` rows were
measured on the same tree, so their value is the same before and after. e2e rows are the
redesign's recorded 128-test run: this retro changes no product code.

| metric | before the redesign | after the redesign | target |
| --- | --- | --- | --- |
| e2e.pass_rate | 100 (128 tests) | 100 (128 tests) | ≥ 100 ok |
| e2e.duration_s | 336.7 | 440.7 | ≤ 360 **miss** (issue #38, tech) |
| a11y.serious | 0 | 0 (75 pages) | ≤ 0 ok |
| bundle.js_kb_gz | 168.5 | 238.2 | ≤ 250 ok |
| design.phone_overflow | 0 | 0 | ≤ 0 ok |
| design.inline_styles | 0 | 0 | ≤ 0 ok |
| design.font_sizes | 5 | 4 | ≤ 4 ok (tightened) |
| design.literal_colors | 0 | 0 | ≤ 0 ok |
| design.overrides | n/a | 0 | ≤ 0 ok (new) |
| design.literal_sizes | n/a | 0 | ≤ 0 ok (new) |
| design.custom_css_lines | 330 | 206 | ≤ 210 ok (new) |

Our own stylesheet shrank from 330 to 206 lines and from 22.6 to 19.8 KB while the app moved
to a component system. The price is 70 KB of JavaScript and 104 s of e2e time.

## What worked
- **Rules written before the build, in the builder's vocabulary.** `brand.md` named the theme
  role (`accent`), the tokens and the six places the primary colour goes. The redesign thread
  built against that table, and the first review was a checklist, not a taste discussion: four
  findings, three fixed in the next pass and one settled as the system's own behaviour.
- **Measuring pixels from the screenshots.** Sampling colours showed what a glance would not:
  the list titles read 5.7:1 in dark but sat dimmer than the date beside them, and the
  sign-in button was neutral grey. e2e cannot see either.
- **One review per batch, issues with a check line.** Each issue said what to look at in
  which scheme and width, so the fix could be confirmed from a screenshot.

## What hurt
- **A rule written from documentation I had not tried.** `brand.md` said to set
  `data-size="md"` on the root. On `<html>` it sets the root font size to 18 px and every
  `rem` grows by an eighth (20 px body text). The redesign thread found it from the
  screenshots. Root cause: the doc page described the attribute on components, and I wrote
  the rule without putting it on a page and measuring.
- **The design metrics measured the old stylesheet.** `design.font_sizes` and
  `design.literal_colors` only knew `styles.css` token blocks, so after the redesign they
  would have passed with any amount of overriding. Nothing counted the thing the brief
  actually asked for: no overrides.
- **A cost nobody owned.** The suite went from 337 s to 441 s and the JS bundle from 169 KB to
  238 KB in one merge. Both are tracked, and the redesign's own metrics run reported the miss,
  but only after the merge. Root cause: the speed and size budgets are read when work lands,
  not while it is being converted page by page.

## Changes applied
| File | Change | Expected effect (metric) |
| --- | --- | --- |
| `scripts/metrics.ts`, `metrics/targets.json` | `design.overrides` (`!important`, assigned `--ds-*` tokens, `.ds-*` selectors), `design.literal_sizes` (px/rem/em or numeric weight in type, shape and depth properties), `design.custom_css_lines` (ceiling 210); `design.font_sizes` tightened from 5 to 4 | An override or a literal size fails the same day; our own CSS cannot grow quietly |
| `docs/process/metrics.md` | Rows for the three new metrics and the new meaning of the old three | The metrics stay documented |
| `docs/process/WORKFLOW.md` | "Layout is looked at on a phone" points at the theme and the layout-only stylesheet | The rule names files that exist |

## Carried forward
- **e2e time and bundle size** (issue #38, tech): the budget is 360 s and 250 KB; the redesign is at
  441 s and 238 KB. Either the suite gets faster or the target is reset with a reason.
- **Rules from documentation get tried first.** A rule that names an attribute, a token or a
  component prop is put on a real page and measured before it is written into `brand.md`.
- **Dialogs and confirmations** were not in the screenshot sets, so they are unreviewed for
  brand fit; `look.ts` prints dialogs and they belong in the next batch.
- Two findings are open as `design` issues: the calendar's shaded "Mon" header (#39) and the
  blue "Optional" chip (#40).
