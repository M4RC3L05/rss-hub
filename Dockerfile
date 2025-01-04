FROM docker.io/denoland/deno:alpine-2.1.4

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .

RUN deno install --node-modules-dir --entrypoint src/apps/api/main.ts
RUN deno install --node-modules-dir --entrypoint src/apps/web/main.ts
RUN deno install --node-modules-dir --entrypoint src/apps/jobs/feeds-synchronizer/main.ts

RUN deno eval "import '@db/sqlite'"
RUN deno eval "import '@b-fuze/deno-dom/native'"

RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno task api || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno task web || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno task jobs:feeds-synchronizer || true

RUN mkdir /app/data

VOLUME [ "/app/data" ]

EXPOSE 4321 4322