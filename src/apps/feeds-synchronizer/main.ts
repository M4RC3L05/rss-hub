import config from "config";
import { makeLogger } from "../../common/logger/mod.js";
import { Cron } from "../../common/utils/cron-utils.js";
import { addHook } from "../../common/utils/process-utils.js";
import { db } from "../../database/mod.js";
import runner from "./app.js";

const { cron } = config.get<{
  cron: { pattern: string; tickerTimeout?: number; timezone: string };
}>("apps.feeds-synchronizer");

const job = new Cron(cron.pattern, cron.timezone, cron.tickerTimeout);
const log = makeLogger("feeds-synchronizer");

addHook({
  name: "feeds-synchronizer",
  async handler() {
    await job.stop().catch((error) => {
      log.error(error, "Could not close job");
    });
    log.info("Server closed");

    db.close();
    log.info("DB Closed");
  },
});

log.info({ nextAt: job.nextAt() }, "Registered feeds-synchronizer");

for await (const signal of job.start()) {
  try {
    log.info(`Running feeds-synchronizer`);

    await runner(signal);
  } catch (error) {
    log.error(error, `Error running feeds-synchronizer task`);
  } finally {
    log.info(`feeds-synchronizer completed`);
    log.info(`Next at ${job.nextAt()}`);
  }
}
