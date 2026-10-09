---
name: write-brief
description: Write a task brief for a Scientia agent before dispatching work. Use whenever the orchestrator is about to hand a task to an agent.
---
# Writing a brief

1. Copy `docs/process/briefs/TEMPLATE.md` to `docs/process/briefs/m<milestone>-<slug>.md`.
2. Pick the role and model from `docs/process/roles.md`. Default to the smallest model that can meet the criteria.
3. Fill **Allowed to touch** with exact paths. If two briefs in flight overlap, split them or serialise them.
4. Write acceptance criteria that a third party can check without asking you: a command and its expected result, a file and what it must contain, a story id that must be covered.
5. If the task is user-facing, add a reviewer brief (lens: accessibility or UX clarity).
6. For tasks over a few minutes, open a GitHub issue titled `[M<n>] <task>` with the brief as its body, and close it when the work is verified.
7. Paste the brief body as the agent's prompt, followed by: "Never call tools whose names start with `mcp__hearthbot__`."
