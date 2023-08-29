import { randomUUID } from "node:crypto";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import config from "config";
import makeLogger from "../../common/logger/mod.js";
import FeedService from "../../common/services/feed-service.js";
import { Cron } from "../../common/utils/cron-utils.js";
import { processUtils } from "../../common/utils/mod.js";
import makeDbClient from "../../database/mod.js";
import { feedResolvers } from "../../common/resolvers/mod.js";
import runner from "./app.js";

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  parseAttributeValue: true,
});
const builder = new XMLBuilder({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
});
const { cron } = config.get<{
  cron: { pattern: string; tickerTimeout?: number; timezone: string };
}>("apps.feeds-synchronizer");
const db = makeDbClient({
  path: config.get<string>("database.path"),
  randomUuid: randomUUID,
});
const feedService = new FeedService({ db, parser, builder, resolvers: feedResolvers });
const job = new Cron(cron.pattern, cron.timezone, cron.tickerTimeout);
const log = makeLogger("feeds-synchronizer");
const run = runner({ db, feedService, logger: makeLogger });

processUtils.addHook({
  name: "feeds-synchronizer",
  async handler() {
    db.close();
    await job.stop();
  },
});

log.info({ nextAt: job.nextAt() }, "Registered feeds-synchronizer");

for await (const signal of job.start()) {
  try {
    log.info(`Running feeds-synchronizer`);

    await run(signal);
  } catch (error) {
    log.error(error, `Error running feeds-synchronizer task`);
  } finally {
    log.info(`feeds-synchronizer completed`);
    log.info(`Next at ${job.nextAt()}`);
  }
}
