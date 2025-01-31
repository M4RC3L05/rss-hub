FROM docker.io/denoland/deno:alpine-2.1.9 as build

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .

RUN deno install

RUN deno task web:bundle:css

FROM docker.io/denoland/deno:alpine-2.1.9

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .
COPY --from=build /app/src/apps/web/public /app/src/apps/web/public

RUN deno install --unstable-npm-lazy-caching --entrypoint src/apps/api/main.ts src/apps/web/main.ts src/apps/jobs/feeds-synchronizer/main.ts
RUN deno eval "import '@db/sqlite'"
RUN deno eval "import '@b-fuze/deno-dom/native'"

RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/api/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/web/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/jobs/feeds-synchronizer/main.ts || true

RUN mkdir /app/data

VOLUME [ "/app/data" ]

EXPOSE 4321 4322
