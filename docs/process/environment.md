# Environment notes

Facts about the machines agents run on that cost time to rediscover.

- **Sandboxed cloud sessions** may block `mise.run`, GitHub release downloads and
  Docker Hub (429). Workarounds that work:
  - mise: `npm i -g @jdxcode/mise`, then `mise link bun@1.4.2 ~/.bun`.
  - Docker images: `docker pull mirror.gcr.io/<image>:<tag>` then
    `docker tag mirror.gcr.io/<image>:<tag> <image>:<tag>` so compose files keep
    the normal names. `scripts/pull-images.sh` does this for every image in
    `docker-compose.yml`.
  - The Docker daemon may need starting: `rm -f /var/run/docker.pid; dockerd > /tmp/dockerd.log 2>&1 &`.
    It can stop again during a session; if a plain background start does not bring it back,
    `setsid nohup dockerd > /tmp/dockerd.log 2>&1 &` does (it outlives the shell that started it).
    After a daemon restart the stacks come back on their own, but PostgREST can start
    before the database and answer 503 until restarted (`docker restart <project>-rest-1`),
    and the slot's hot-reload dev server is gone (run `scripts/slot.sh up <n>` again).
- **Playwright browsers**: if a preinstalled Chromium exists, set
  `PW_CHROMIUM_PATH` to it; otherwise `bunx playwright install chromium`.
- In the Claude cloud sandbox: `export PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- **Parallel agents**: never share one stack. `scripts/slot.sh up <n>` starts an isolated
  stack plus a hot-reloading dev server; `eval "$(scripts/slot.sh env <n>)"` then
  `bunx playwright test <spec>` runs against it. `scripts/slot.sh down <n>` when done.
  The dev server builds React in development mode and is about a fifth slower: for the
  run `mise run metrics` reads, set `BASE_URL=http://localhost:310<n>` (the slot's
  production build, rebuilt by `slot.sh up <n>`). Sandboxes also differ from each other
  by up to a quarter, so compare `e2e.duration_s` between runs on the same machine.
- **Patched dependency**: `patches/` marks `@digdir/designsystemet-react` side-effect
  free. If `bundle.js_kb_gz` jumps by about 30 KB, check that
  `node_modules/@digdir/designsystemet-react/package.json` has `"sideEffects": false`;
  if not, delete `~/.bun/install/cache/@digdir/designsystemet-react@*_patch_hash=*` and
  run `bun install` again (a cache entry written by `bun patch` can miss the change).
- **Stale checkout**: metrics, `look.ts` and the specs run from your own checkout, so
  `git pull --rebase origin main` before using them. In round 9 a checkout from before
  2026-10-09 23:38 reported `ux.blind_tasks_done_pct` from the round 4 file (85.7) while
  main read round 9 (100). Nobody edits a path: the metric takes the newest review file
  with a full seven-scenario first pass by itself.
