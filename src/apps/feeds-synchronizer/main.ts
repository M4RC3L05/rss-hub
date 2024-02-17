import { ShutdownManager } from "@m4rc3l05/shutdown-manager";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.js";
import { Cron } from "#src/common/utils/cron-utils.js";
import { makeDatabase } from "#src/database/mod.js";
import { FeedService } from "#src/services/mod.js";
import runner from "./app.js";

const { cron } = config.get<{
  cron: { pattern: string; tickerTimeout?: number; timezone: string };
}>("apps.feeds-synchronizer");
const log = makeLogger("feeds-synchronizer");

const shutdownManager = new ShutdownManager({ log: log });

const db = makeDatabase();

shutdownManager.addHook("database", () => {
  if (db.open) {
    db.close();
  }
});

const job = new Cron(cron.pattern, cron.timezone, cron.tickerTimeout);

shutdownManager.addHook("feeds-synchronizer", async () => {
  await job.stop();
});

log.info({ nextAt: job.nextAt() }, "Registered feeds-synchronizer");

for await (const signal of job.start()) {
  try {
    log.info("Running feeds-synchronizer");

    await runner({ signal, db, feedService: new FeedService(db) });
  } catch (error) {
    log.error(error, "Error running feeds-synchronizer task");
  } finally {
    log.info("feeds-synchronizer completed");
    log.info(`Next at ${job.nextAt()}`);
  }
}
