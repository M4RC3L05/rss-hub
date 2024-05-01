import { Cron } from "@m4rc3l05/cron";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.ts";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { FeedService } from "#src/services/mod.ts";
import runner from "#src/apps/feeds-synchronizer/app.ts";
import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";
import { gracefulShutdown } from "#src/common/process/mod.ts";

const { cron } = config.get<{
  cron: { pattern: string; tickerTimeout?: number; timezone: string };
}>("apps.feeds-synchronizer");
const log = makeLogger("feeds-synchronizer");

const processLifecycle = new ProcessLifecycle();

gracefulShutdown({ processLifecycle, log });

processLifecycle.registerService({
  name: "db",
  boot: () => makeDatabase(),
  shutdown: (db) => db.close(),
});

processLifecycle.registerService({
  name: "feeds-synchronizer-cron",
  boot: (pl) => {
    const db = pl.getService<CustomDatabase>("db");
    const job = async (signal: AbortSignal) => {
      try {
        log.info("Running feeds-synchronizer");
        await runner({ signal, db, feedService: new FeedService(db) });
      } catch (error) {
        log.error(error, "Error running feeds-synchronizer task");
      } finally {
        log.info("feeds-synchronizer completed");

        if (!signal.aborted) {
          log.info(`Next at ${cronInstance.nextAt()}`);
        }
      }
    };

    const cronInstance = new Cron(job, {
      when: cron.pattern,
      timezone: cron.timezone,
      tickerTimeout: cron.tickerTimeout,
    });

    cronInstance.start();

    return cronInstance;
  },
  shutdown: (cron) => cron.stop(),
});

await processLifecycle.boot();
