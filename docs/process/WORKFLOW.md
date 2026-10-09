# How we work

Scientia is built by a small team of coordinated agents led by an **orchestrator**.
The process is meant to get measurably better over time: every milestone ends
with a retro that reads the numbers and edits the files in this folder.

## The loop

Every milestone runs the same five steps.

1. **Plan.** The orchestrator splits the milestone into tasks. Each task gets a
   brief written from [briefs/TEMPLATE.md](briefs/TEMPLATE.md) and, for
   anything larger than a few minutes, a GitHub issue carrying that brief.
2. **Dispatch.** Each brief goes to the role that fits it (see
   [roles.md](roles.md)), on the model that role names. Tasks that do not touch
   the same files run in parallel. When a question benefits from several
   viewpoints (research, reviews), send the same brief to two or three agents
   with different lenses and merge the results.
3. **Verify.** The orchestrator never trusts a report on its own. It reads the
   diff or document, runs `mise run check`, and sends work back with a precise
   note when it misses the brief's acceptance criteria.
4. **Measure.** `mise run metrics` appends one line to
   [`metrics/history.jsonl`](../../metrics/history.jsonl) and prints the delta
   against the previous run and against [`metrics/targets.json`](../../metrics/targets.json).
   See [metrics.md](metrics.md).
5. **Retro.** At the end of the milestone the process-coach runs the
   [retro skill](../../.claude/skills/retro/SKILL.md). The retro is written to
   `docs/retros/` and **must change at least one process file** (this file,
   roles, briefs template, metrics, agent definitions, skills or targets), or
   explain why nothing should change. Unchanged process after a bad number is a
   failed retro.

## Rules that keep quality up

- **A brief is a contract.** Inputs, the exact files the agent may touch,
  acceptance criteria that can be checked, and what to return. Vague briefs are
  the first thing a retro looks at when output disappoints.
- **One owner per file at a time.** Parallel agents get disjoint file sets.
  Shared files (schema, router, design tokens) belong to the orchestrator.
- **No unit tests.** Behaviour is proven with Playwright end-to-end tests, one
  spec per user story, tagged with the story id (`@US-12`).
- **Every user story is covered.** A story without a passing e2e test is not
  done. Story coverage is a tracked metric.
- **Accessibility is not optional.** Every e2e spec runs an axe scan of the
  pages it visits; serious or critical violations fail the metric target.
- **Decisions are written down.** Anything a future contributor would ask "why"
  about goes in `docs/decisions/` as a short ADR (context, decision,
  consequences).
- **Push to `main`, never deploy.** Branches are fine for risky work.

## Definitions of done

| Work | Done when |
| --- | --- |
| Research | Sources cited, findings mapped to user stories or explicitly rejected |
| User story | Has id, actor, goal, acceptance criteria, priority, and a screen in the IA plan |
| Feature | All its stories have passing e2e specs, no new serious a11y violations, `mise run check` green |
| Milestone | Above holds for every task, metrics recorded, retro written and applied |
