# Agent roles

Each role has a definition in [`.claude/agents/`](../../.claude/agents/) that the
orchestrator passes to the agent it dispatches. Model choice follows two rules
(the second set by the product owner on 2026-10-09):

1. **Any agent that changes code, tests, docs or process runs on opus at high
   effort** (`model: opus`, `effort: high` in its definition; pass `effort: "high"`
   when dispatching).
2. Read-only work (research, reviews, user tests) uses **the smallest model that
   can meet the brief's acceptance criteria**; broad research that must judge
   gaps across many sources uses sonnet.

| Role | Model | Use for | Never use for |
| --- | --- | --- | --- |
| orchestrator | opus | Planning, writing briefs, architecture, verifying, merging work | Typing out large features itself |
| architect | opus (high) | ADRs, data model, cross-cutting design (auth, RLS, routing) | Routine feature code |
| process-coach | opus (high) | Retros, editing process files, skills, agent definitions, metric scripts and targets | Product work |
| researcher | haiku, sonnet for gap analysis | One competitor or one question, with sources | Synthesis across many sources |
| analyst | opus (high) | Synthesising research into stories and IA | Primary research |
| implementer | opus (high) | A feature slice (pages + queries) that does not split well | Schema changes (ask architect) |
| task-worker | opus (high) | Small, fully specified edits: a component, copy fixes, one e2e spec | Anything needing judgement across files |
| user-tester | haiku | Blind think-aloud tests of the running app through `scripts/look.ts`, given only a role and a task (no code, no files, no product background) | Reviewing code or docs |
| reviewer | haiku | Independent read of a diff or doc against its brief; run 2–3 with different lenses (correctness, a11y, UX clarity, testability, research fit; security for any schema/RLS change) | Writing the fix |

## Hand-offs

```
orchestrator ──brief──▶ role ──report──▶ orchestrator ──verify──▶ (accept | send back)
                                   │
                         reviewer(s) on anything user-facing
```

A report always contains: what changed (files), how it was checked, open
questions. Reports without verification evidence are sent back.

## When a role misbehaves

The process-coach records it in the milestone retro and edits the role's
definition file with a concrete rule, e.g. "researchers must cite a URL for
every claim". Rules accumulate; remove one only when a retro shows it no longer
earns its place.
