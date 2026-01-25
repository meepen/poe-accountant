# syntax=docker/dockerfile:1

FROM pathofexile.accountant.localhost/base AS production

ENTRYPOINT ["pnpm", "run", "--filter=@meepen/poe-accountant-frontend", "start"]
