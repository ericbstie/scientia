# syntax=docker/dockerfile:1
FROM oven/bun:1.4.2-alpine
WORKDIR /srv
COPY package.json bun.lock ./
# Optional extra CA (only for sandboxes behind a TLS-inspecting proxy, see docs/process/environment.md)
RUN --mount=type=secret,id=extra_ca,target=/tmp/extra-ca.crt,required=false \
    if [ -f /tmp/extra-ca.crt ]; then export NODE_EXTRA_CA_CERTS=/tmp/extra-ca.crt; fi; \
    bun install --frozen-lockfile --production
COPY app ./app
COPY supabase ./supabase
COPY tsconfig.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "app/server.ts"]
