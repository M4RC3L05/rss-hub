import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeDatabase } from "#src/database/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import FeedService from "#src/services/feed-service.ts";
import { makeServer } from "#src/apps/api/server.ts";

const { promise: shutdownPromise, signal: shutdownSignal } = gracefulShutdown();

using database = makeDatabase();
await using _server = makeServer(
  makeApp({
    shutdown: shutdownSignal,
    database: database,
    feedService: new FeedService(database),
  }),
);

await shutdownPromise;
