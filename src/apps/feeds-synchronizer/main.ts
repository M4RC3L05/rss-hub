import { Cron } from "@m4rc3l05/cron";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.ts";
import { makeDatabase } from "#src/database/mod.ts";
import { FeedService } from "#src/services/mod.ts";
import runner from "#src/apps/feeds-synchronizer/app.ts";
import { HookDrain } from "#src/common/process/hook-drain.ts";

const { cron } = config.get<{
  cron: { pattern: string; tickerTimeout?: number; timezone: string };
}>("apps.feeds-synchronizer");
const log = makeLogger("feeds-synchronizer");

const shutdown = new HookDrain({
  log,
  onFinishDrain: (error) => {
    log.info("Exiting application");

    if (error.error) {
      if (error.reason === "timeout") {
        log.warn("Global shutdown timeout exceeded");
      }

      Deno.exit(1);
    } else {
      Deno.exit(0);
    }
  },
});

const db = makeDatabase();

shutdown.registerHook({
  name: "database",
  fn: () => {
    db.close();
  },
});

const job = new Cron(cron.pattern, cron.timezone, cron.tickerTimeout);

shutdown.registerHook({
  name: "feeds-synchronizer",
  fn: async () => {
    await job.stop();
  },
});

log.info("Registered feeds-synchronizer", { nextAt: job.nextAt() });

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
