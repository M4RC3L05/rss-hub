FROM docker.io/denoland/deno:alpine-1.46.3

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .
RUN mkdir /app/data

RUN deno task deps
RUN deno eval --unstable-ffi "import '@db/sqlite'"
RUN deno eval --unstable-ffi "import '@b-fuze/deno-dom/native'"

VOLUME [ "/app/data" ]

EXPOSE 4321 4322
