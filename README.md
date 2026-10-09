# Scientia

Utdanningsinstitusjoners og studenters portal for innleveringer, emneplanlegging og informasjon.

A calm, minimal learning platform: students see what is due, hand in work and read
feedback; teachers publish material, collect submissions and grade. Built as a
better-designed alternative to Blackboard and Canvas.

## Quick start

```sh
docker compose up
```

Open http://localhost:3000. Demo accounts are listed on the sign-in page.

## Development

```sh
mise install          # installs the pinned Bun
mise run install      # JS dependencies
mise run up           # stack in the background
mise run e2e          # Playwright tests, one per user story
mise run metrics      # quality metrics vs targets
```

## How this project is built

The project is developed by coordinated agents following a measured,
self-improving process: see [docs/process/WORKFLOW.md](docs/process/WORKFLOW.md),
[roles](docs/process/roles.md), [metrics](docs/process/metrics.md) and the
[retros](docs/retros/). Decisions are in [docs/decisions/](docs/decisions/).
