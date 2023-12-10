/* eslint-disable no-await-in-loop */
import * as _ from "lodash-es";
import sql from "@leafac/sqlite";
import { stdSerializers } from "pino";
import { type FeedsTable } from "../../database/types/mod.js";
import { makeLogger } from "../../common/logger/mod.js";
import { type CustomDatabase } from "../../database/mod.js";
import { feedService } from "../../services/mod.js";

const log = makeLogger("feed-synchronizer-runner");

const runner = async ({ signal, db }: { signal?: AbortSignal; db: CustomDatabase }) => {
  const feeds = db.all<FeedsTable>(sql`select * from feeds`);

  log.info("Synching begin");

  for (const feed of feeds) {
    log.info({ feed }, `Synching feed ${feed.url}`);

    try {
      const { faildCount, failedReasons, successCount, totalCount } = await feedService.syncFeed(
        feed,
        { signal, database: db },
      );

      log.info(
        {
          failedReasons: failedReasons.map((reason) =>
            reason instanceof Error ? stdSerializers.errWithCause(reason) : reason,
          ),
          faildCount,
          successCount,
          totalCount,
          feed,
        },
        `Done processing ${feed.url}, ${totalCount} items, with ${successCount} succeeded and ${faildCount} failed`,
      );
    } catch (error) {
      log.error(error, `Sync failed ${feed.url}`);
    } finally {
      log.info({ feed }, `Synching synced ${feed.url}`);
    }

    if (signal?.aborted) {
      break;
    }
  }

  log.info(`Synching ended`);
};

export default runner;
