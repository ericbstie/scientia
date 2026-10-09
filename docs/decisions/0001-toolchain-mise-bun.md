# 0001 Toolchain: mise for tools and tasks, Bun for runtime, bundling and packages

Date: 2026-10-09 · Status: accepted

## Context
Eric asked for bun, React, mise and Supabase, runnable with `docker compose up`.

## Decision
- `mise.toml` pins Bun and is the single task runner (`mise run up|dev|e2e|metrics|check`).
- Bun is the package manager, the dev server and the bundler (HTML imports via `Bun.serve`). No Vite, no Node build step.
- Playwright is run through `bunx playwright test`.
- Docker images for the stack are pinned to exact tags.

## Consequences
- One `mise install` gives a contributor everything except Docker.
- If mise cannot reach its download hosts (some sandboxes), `npm i -g @jdxcode/mise` installs mise and `mise link bun@1.4.2 ~/.bun` uses an existing Bun.

## Alternatives considered
Vite for dev/bundling (more plugins, but a second toolchain); npm scripts as task runner (mise already required).
