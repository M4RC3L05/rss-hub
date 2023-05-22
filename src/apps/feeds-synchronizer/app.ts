/* eslint-disable no-await-in-loop */
import * as _ from "lodash-es";
import { type Kysely } from "kysely";
import { type DB } from "kysely-codegen";
import { type Logger } from "pino";
import type FeedService from "../../common/services/feed-service.js";

type FeedSynchronizerDeps = {
  db: Kysely<DB>;
  log: Logger;
  feedService: FeedService;
};

const run = async (
  { db, log, feedService }: FeedSynchronizerDeps,
  { signal }: { signal: AbortSignal },
) => {
  const feeds = await db.selectFrom("feeds").selectAll().execute();

  log.info("Synching begin");

  for (const feed of feeds) {
    log.info({ feed }, `Synching feed ${feed.url}`);

    try {
      const { faildCount, failedReasons, successCount, totalCount } = await feedService.syncFeed(
        feed,
        { signal },
      );

      log.info(
        { failedReasons, faildCount, successCount, totalCount, feed },
        `Done processing ${feed.url}, ${totalCount} items, with ${successCount} sucessed and ${faildCount} failed`,
      );
    } catch (error) {
      log.error(error, `Sync failed ${feed.url}`);
    } finally {
      log.info({ feed }, `Synching synced ${feed.url}`);
    }

    if (signal.aborted) {
      break;
    }
  }

  log.info(`Synching ended`);
};

export default run;
