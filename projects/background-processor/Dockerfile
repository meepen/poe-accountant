# syntax=docker/dockerfile:1

FROM base AS production

ENTRYPOINT ["pnpm", "run", "--filter=@meepen/poe-accountant-background-processor", "start"]
