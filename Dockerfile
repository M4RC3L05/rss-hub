FROM docker.io/denoland/deno:alpine-2.3.3

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .

RUN deno install --unstable-npm-lazy-caching --entrypoint src/apps/api/main.ts src/apps/web/main.ts src/apps/jobs/feeds-synchronizer/main.ts
RUN deno eval "import '@db/sqlite'"

RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 30s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/api/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 30s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/web/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 30s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/jobs/feeds-synchronizer/main.ts || true

RUN mkdir /app/data

VOLUME [ "/app/data" ]

EXPOSE 4321 4322
