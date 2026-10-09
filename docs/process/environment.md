# Environment notes

Facts about the machines agents run on that cost time to rediscover.

- **Sandboxed cloud sessions** may block `mise.run`, GitHub release downloads and
  Docker Hub (429). Workarounds that work:
  - mise: `npm i -g @jdxcode/mise`, then `mise link bun@1.4.2 ~/.bun`.
  - Docker images: `docker pull mirror.gcr.io/<image>:<tag>` then
    `docker tag mirror.gcr.io/<image>:<tag> <image>:<tag>` so compose files keep
    the normal names. `scripts/pull-images.sh` does this for every image in
    `docker-compose.yml`.
  - The Docker daemon may need starting: `dockerd > /tmp/dockerd.log 2>&1 &`.
    After a daemon restart the stacks come back on their own, but PostgREST can start
    before the database and answer 503 until restarted (`docker restart <project>-rest-1`),
    and the slot's hot-reload dev server is gone (run `scripts/slot.sh up <n>` again).
- **Playwright browsers**: if a preinstalled Chromium exists, set
  `PW_CHROMIUM_PATH` to it; otherwise `bunx playwright install chromium`.
- In the Claude cloud sandbox: `export PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- **Parallel agents**: never share one stack. `scripts/slot.sh up <n>` starts an isolated
  stack plus a hot-reloading dev server; `eval "$(scripts/slot.sh env <n>)"` then
  `bunx playwright test <spec>` runs against it. `scripts/slot.sh down <n>` when done.
