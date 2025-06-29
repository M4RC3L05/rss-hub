import { makeLogger } from "#src/common/logger/mod.ts";
import { makeDatabase } from "#src/database/mod.ts";
import { FeedService } from "#src/services/mod.ts";
import runner from "#src/apps/jobs/feeds-synchronizer/app.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";

const log = makeLogger("feeds-synchronizer");

const { done, signal: shutdownSignal } = gracefulShutdown();

await using ads = new AsyncDisposableStack();
const database = ads.use(makeDatabase());

try {
  log.info("Running feeds-synchronizer");

  await runner({
    signal: shutdownSignal,
    db: database,
    feedService: new FeedService(database),
  });
} catch (error) {
  log.error("Error running feeds-synchronizer task", { error });
} finally {
  log.info("feeds-synchronizer completed");
}

await done();
