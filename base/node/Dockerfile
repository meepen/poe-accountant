# syntax=docker/dockerfile:1

FROM node:24-slim
ENV CI=true
ENV BUILDKIT_PROGRESS=plain
RUN corepack enable
RUN corepack prepare pnpm@^10.26.1 --activate

WORKDIR /app
USER root

COPY --from=pathofexile.accountant.localhost/root-config /out/pnpm-lock.yaml .
COPY --from=pathofexile.accountant.localhost/root-config /out/pnpm-workspace.yaml .
COPY projects /app/projects
RUN pnpm install --frozen-lockfile

RUN --mount=type=secret,id=env \
    set -a; . /run/secrets/env; set +a; pnpm -r build


# Each file that uses this base image should update ENTRYPOINT as needed.
# ENTRYPOINT ["pnpm", "run", "--filter=@meepen/poe-accountant", "start"]
