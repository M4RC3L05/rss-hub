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
  boot: () => new Cron(cron.pattern, cron.timezone, cron.tickerTimeout),
  shutdown: (cron) => cron.stop(),
});

await processLifecycle.boot();

const cronJob = processLifecycle.getService<Cron>("feeds-synchronizer-cron");
const db = processLifecycle.getService<CustomDatabase>("db");

log.info("Registered feeds-synchronizer", { nextAt: cronJob.nextAt() });

for await (const signal of cronJob.start()) {
  try {
    log.info("Running feeds-synchronizer");

    await runner({ signal, db, feedService: new FeedService(db) });
  } catch (error) {
    log.error(error, "Error running feeds-synchronizer task");
  } finally {
    log.info("feeds-synchronizer completed");
    log.info(`Next at ${cronJob.nextAt()}`);
  }
}
