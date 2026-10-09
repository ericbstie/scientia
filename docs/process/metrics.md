# Quality metrics

All metrics are produced by `mise run metrics` ([`scripts/metrics.ts`](../../scripts/metrics.ts)),
appended to [`metrics/history.jsonl`](../../metrics/history.jsonl) and compared with
[`metrics/targets.json`](../../metrics/targets.json). Numbers that cannot be
measured yet are recorded as `null`, never guessed.

| Metric | Source | Why it matters | Direction |
| --- | --- | --- | --- |
| `stories.total` | `docs/stories/*.md`, ids like `US-12` | Size of the product promise | — |
| `stories.covered_pct` | Story ids tagged in `e2e/**/*.spec.ts` | Every promise is tested | ↑ target 100 |
| `e2e.pass_rate` | Playwright JSON report | The product works | ↑ target 100 |
| `e2e.duration_s` | Playwright JSON report, against the production build (`docker compose up`); the hot-reloading dev server is slower | Fast feedback keeps agents honest | ↓ target ≤ 360 |
| `e2e.flaky` | Tests that passed only on retry | Flaky tests hide regressions | ↓ target 0 |
| `a11y.serious` | axe-core results written by the e2e fixture | Usable by everyone, keyboard and screen reader | ↓ target 0 |
| `a11y.pages_scanned` | same | Scans actually happen | ↑ |
| `design.phone_overflow` | Pages from the same scans that scroll sideways at 390 px wide; tables may scroll inside `.table-wrap`. `mise run metrics` prints each page and the element that is too wide | Phone layout stays usable after nobody is looking at it | ↓ target 0 |
| `bundle.js_kb_gz` | `dist/` after `mise run build` | Minimal UI should load fast | ↓ target ≤ 250 |
| `ux.max_clicks_to_core_task` | `docs/design/ia.md` click budget table | Core tasks stay shallow | ↓ target ≤ 3 |
| `copy.leaks` | Forbidden terms (other products, process words) in `app/src` strings | Copy says only what the user needs | ↓ target 0 |
| `design.inline_styles` | `style={{` and `<style>` in `app/src/**/*.tsx` | The look lives in the theme and one small stylesheet, not in pages | ↓ target 0 |
| `design.font_sizes` | Distinct `font-size` values in `app/src/styles.css` (all of them system tokens) | Few type sizes read as one brand | ↓ target ≤ 4 |
| `design.literal_colors` | Colour literals outside the `:root` blocks of `styles.css` and in `.tsx` | Colours come from `--ds-color-…` tokens, so dark mode and the theme stay one edit | ↓ target 0 |
| `design.overrides` | `!important`, an assigned `--ds-*` token or a `.ds-*` selector in `styles.css` | Components keep the look the system and the theme give them (brand rule 1) | ↓ target 0 |
| `design.literal_sizes` | A px/rem/em size or numeric weight in `font-size`, `line-height`, `border-radius`, `box-shadow` or `font-weight` outside `var()` | Type, shape and depth are tokens | ↓ target 0 |
| `design.custom_css_lines` | Non-blank, non-comment lines of `app/src/styles.css` | Our own CSS stays page layout only; 330 before the redesign, 206 after | ↓ target ≤ 210 (ratchet down) |
| `ux.blind_tasks_done_pct` | First-pass `\| Scenario \| Result \|` table in the newest `docs/process/reviews/m<n>-user-test.md` (Done / Partly / Failed) | A newcomer can finish the core tasks; e2e only proves the stories we wrote | ↑ target 100 |
| `process.briefs_with_criteria_pct` | `docs/process/briefs/*.md` with an "Acceptance criteria" section | Briefs are contracts | ↑ target 100 |
| `process.retro_changes` | Process files touched by the last retro commit | Retros lead to change | ↑ ≥ 1 |

## Reading the numbers in a retro

- A metric that moved the wrong way gets a cause and a process change.
- A metric that stayed at `null` for a whole milestone is either wired up or
  deleted.
- `e2e.*` is `null` when `report.json` is older than `a11y.jsonl` (a run with
  another `--reporter` left an old report). Rerun with the config's reporters.
- Targets only tighten. Loosen one only with an ADR.
