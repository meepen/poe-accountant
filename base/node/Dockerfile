# syntax=docker/dockerfile:1

FROM node:24-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

ENV CI=true
ENV BUILDKIT_PROGRESS=plain
RUN corepack enable
RUN corepack prepare pnpm@^10.26.1 --activate

WORKDIR /app
USER root

ENV PNPM_STORE_PATH=/pnpm-store

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,target=/pnpm-store pnpm fetch

COPY . .

RUN --mount=type=cache,target=/pnpm-store pnpm install --offline --frozen-lockfile

RUN --mount=type=cache,target=/pnpm-store \
    --mount=type=secret,id=env \
    set -a; . /run/secrets/env; set +a; pnpm -r build


# Each file that uses this base image should update ENTRYPOINT as needed.
# ENTRYPOINT ["pnpm", "run", "--filter=@meepen/poe-accountant", "start"]
