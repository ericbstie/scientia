---
name: measure
description: Collect and interpret Scientia quality metrics (story coverage, e2e pass rate, accessibility, bundle size, process health). Use before and after significant changes and in every retro.
---
# Measure

1. `mise run up` (stack must be healthy for e2e) and `mise run build`.
2. `mise run e2e` writes `e2e/.results/report.json` and `e2e/.results/a11y.jsonl`.
3. `mise run metrics` appends to `metrics/history.jsonl` and prints current vs previous vs target.
4. Any metric worse than its target or than the previous run is a finding: record it in the current retro or open an issue `[metrics] <metric> regressed`.
