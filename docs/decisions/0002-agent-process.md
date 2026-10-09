# 0002 Agent-driven process with metric-driven retros

Date: 2026-10-09 · Status: accepted

## Context
The product is built by coordinated AI agents with an owner who is mostly away. Quality must be visible without a human reading every diff.

## Decision
- Roles and models are fixed in `docs/process/roles.md` and `.claude/agents/`: haiku for well-defined tasks and parallel research/review lenses, sonnet for large slices that do not decompose, opus for architecture and process.
- Every task starts from a brief with checkable acceptance criteria (`docs/process/briefs/`).
- Quality is tracked by `scripts/metrics.ts` against `metrics/targets.json`.
- Each milestone ends with a retro that must edit at least one process file.
- No unit tests: one Playwright e2e spec per user story, with an axe scan.

## Consequences
Process files are living documents, edited only through retros. Metrics are cheap to compute so they are run often.
