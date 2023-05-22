import { randomUUID } from "node:crypto";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import config from "config";
import makeLogger from "../../common/logger/mod.js";
import FeedService from "../../common/services/feed-service.js";
import { Cron } from "../../common/utils/cron-utils.js";
import { processUtils } from "../../common/utils/mod.js";
import makeDbClient from "../../database/mod.js";
import { feedResolvers } from "../../common/resolvers/mod.js";
import run from "./app.js";

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  parseAttributeValue: true,
});
const builder = new XMLBuilder({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
});

const { timezone, cron } = config.get<{ timezone: string; cron: string }>(
  "apps.feeds-synchronizer",
);
const db = makeDbClient({ path: config.get<string>("database.path"), randomUuid: randomUUID });
const feedService = new FeedService({ db, parser, builder, resolvers: feedResolvers });
const job = new Cron(cron, timezone);
const log = makeLogger("feeds-synchronizer");
const runnerLog = makeLogger("feed-synchronizer-runner");

processUtils.addHook({
  name: "feeds-synchronizer",
  async handler() {
    await db.destroy();
    await job.stop();
  },
});

log.info({ nextDate: job.nextTime().toISOString() }, "Registered feeds-synchronizer");

for await (const signal of job.start()) {
  try {
    log.info(`Running feeds-synchronizer`);

    await run({ db, feedService, log: runnerLog }, { signal });
  } catch (error) {
    log.error(error, `Error running feeds-synchronizer task`);
  } finally {
    log.info(`feeds-synchronizer completed`);
    log.info(`Next at ${job.nextTime()?.toISOString()}`);
  }
}
