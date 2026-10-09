---
name: retro
description: Run the end-of-milestone retrospective for Scientia, using metrics to decide concrete edits to the process files. Use when a milestone finishes or a tracked metric regresses.
---
# Retro

1. Run `mise run metrics` (start the stack first if e2e numbers are needed). Copy the delta table.
2. Read every brief in `docs/process/briefs/m<n>-*.md` and the commits since the previous retro (`git log --oneline <last-retro-commit>..`).
3. For each brief, note: did the first report meet the acceptance criteria? If not, why: vague brief, wrong model, missing input, or tooling?
4. Write `docs/retros/m<n>.md` from `docs/process/retro-template.md`.
5. Apply the changes in the same commit: edit `docs/process/*.md`, `.claude/agents/*.md`, `.claude/skills/**`, `scripts/metrics.ts` or `metrics/targets.json`. At least one change, or a written reason for none.
6. Commit as `retro(m<n>): <one-line summary>` so `process.retro_changes` can count the touched files.
