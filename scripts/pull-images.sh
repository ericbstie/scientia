#!/usr/bin/env sh
# For sandboxes where Docker Hub is blocked or rate-limited: pull every image in
# docker-compose.yml through mirror.gcr.io and tag it with its normal name.
set -e
cd "$(dirname "$0")/.."
for img in $(grep -E '^\s+image:' docker-compose.yml | awk '{print $2}') oven/bun:1.4.2-alpine; do
  docker image inspect "$img" >/dev/null 2>&1 && continue
  docker pull "mirror.gcr.io/$img" && docker tag "mirror.gcr.io/$img" "$img"
done
