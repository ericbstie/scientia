#!/usr/bin/env bash
# Isolated stack per agent/worktree, so parallel e2e runs don't reset each other's data.
#   scripts/slot.sh up <n>     start stack "scientia-<n>" + a hot-reloading web server on the host
#   scripts/slot.sh env <n>    print the env vars to run e2e against slot n
#   scripts/slot.sh down <n>   stop it
# Slot n uses ports: container web 3100+n, db 54400+n, host dev server 3200+n.
set -euo pipefail
cmd=${1:?up|env|down}; n=${2:?slot number}
cd "$(dirname "$0")/.."
ANON=$(grep '^ANON_KEY=' .env.example | cut -d= -f2)
SERVICE=$(grep '^SERVICE_ROLE_KEY=' .env.example | cut -d= -f2)
export COMPOSE_PROJECT_NAME="scientia-$n" WEB_PORT=$((3100 + n)) DB_PORT=$((54400 + n))
DEV_PORT=$((3200 + n))
PIDFILE="/tmp/scientia-slot-$n.pid"
# Stops the slot's dev server (a stale one keeps serving old code on the same port). The pid file
# can outlive it (a sandbox restart), and its pid may since belong to another process: only a
# process that is still this app's server is stopped.
stop_dev() {
  local pid
  pid=$(cat "$PIDFILE" 2>/dev/null) || return 0
  if ps -p "$pid" -o args= 2>/dev/null | grep -q "app/server.ts"; then kill "$pid"; fi
  rm -f "$PIDFILE"
}
case "$cmd" in
  env)
    echo "export BASE_URL=http://localhost:$DEV_PORT"
    echo "export DATABASE_URL=postgres://postgres:scientia-local-db-password@127.0.0.1:$DB_PORT/postgres"
    echo "export AUTH_URL=http://localhost:$WEB_PORT/auth/v1 STORAGE_URL=http://localhost:$WEB_PORT/storage/v1"
    echo "export SERVICE_ROLE_KEY=$SERVICE"
    [ -n "${PW_CHROMIUM_PATH:-}" ] && echo "export PW_CHROMIUM_PATH=$PW_CHROMIUM_PATH"
    ;;
  up)
    files=(-f docker-compose.yml)
    [ -f /root/.ccr/ca-bundle.crt ] && files+=(-f docker-compose.sandbox.yml)
    docker compose -p "$COMPOSE_PROJECT_NAME" "${files[@]}" up -d --build --wait > "/tmp/scientia-slot-$n-compose.log" 2>&1 || { tail -30 "/tmp/scientia-slot-$n-compose.log"; exit 1; }
    stop_dev
    # Host dev server (hot reload) that proxies to the slot's container web server.
    env PORT=$DEV_PORT ANON_KEY="$ANON" SERVICE_ROLE_KEY="$SERVICE" \
      AUTH_URL=http://localhost:$WEB_PORT/auth/v1 REST_URL=http://localhost:$WEB_PORT/rest/v1 STORAGE_URL=http://localhost:$WEB_PORT/storage/v1 \
      nohup bun --hot app/server.ts > "/tmp/scientia-slot-$n.log" 2>&1 &
    echo $! > "$PIDFILE"
    for _ in $(seq 1 50); do curl -sf "http://localhost:$DEV_PORT/healthz" >/dev/null && break; sleep 0.2; done
    echo "slot $n: app http://localhost:$DEV_PORT (log /tmp/scientia-slot-$n.log). Run: eval \"\$(scripts/slot.sh env $n)\""
    ;;
  down)
    stop_dev
    docker compose -p "$COMPOSE_PROJECT_NAME" down -v >/dev/null 2>&1
    ;;
esac
