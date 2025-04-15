import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeDatabase } from "#src/database/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import FeedService from "#src/services/feed-service.ts";
import { makeServer } from "#src/apps/api/server.ts";

const { promise: shutdownP, signal: shutdownSignal } = gracefulShutdown();

await using ads = new AsyncDisposableStack();
const database = ads.use(makeDatabase());

ads.use(makeServer(
  makeApp({
    shutdown: shutdownSignal,
    database: database,
    feedService: new FeedService(database),
  }),
));

await shutdownP;
