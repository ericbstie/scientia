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
| `e2e.duration_s` | Playwright JSON report | Fast feedback keeps agents honest | ↓ |
| `e2e.flaky` | Tests that passed only on retry | Flaky tests hide regressions | ↓ target 0 |
| `a11y.serious` | axe-core results written by the e2e fixture | Usable by everyone, keyboard and screen reader | ↓ target 0 |
| `a11y.pages_scanned` | same | Scans actually happen | ↑ |
| `bundle.js_kb_gz` | `dist/` after `mise run build` | Minimal UI should load fast | ↓ target ≤ 250 |
| `ux.max_clicks_to_core_task` | `docs/design/ia.md` click budget table | Core tasks stay shallow | ↓ target ≤ 3 |
| `process.briefs_with_criteria_pct` | `docs/process/briefs/*.md` with an "Acceptance criteria" section | Briefs are contracts | ↑ target 100 |
| `process.retro_changes` | Process files touched by the last retro commit | Retros lead to change | ↑ ≥ 1 |

## Reading the numbers in a retro

- A metric that moved the wrong way gets a cause and a process change.
- A metric that stayed at `null` for a whole milestone is either wired up or
  deleted.
- Targets only tighten. Loosen one only with an ADR.
