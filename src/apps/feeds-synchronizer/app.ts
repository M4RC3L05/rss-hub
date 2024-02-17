import { sql } from "@m4rc3l05/sqlite-tag";
import { stdSerializers } from "pino";
import { makeLogger } from "#src/common/logger/mod.js";
import type { CustomDatabase } from "#src/database/mod.js";
import type { FeedsTable } from "#src/database/types/mod.js";
import type { FeedService } from "#src/services/mod.js";

const log = makeLogger("feed-synchronizer-runner");

const runner = async ({
  signal,
  feedService,
  db,
}: { signal?: AbortSignal; db: CustomDatabase; feedService: FeedService }) => {
  const feeds = db.all<FeedsTable>(sql`select * from feeds`);

  log.info("Synching begin");

  for (const feed of feeds) {
    log.info({ feed }, `Synching feed ${feed.url}`);

    try {
      const { faildCount, failedReasons, successCount, totalCount } =
        await feedService.syncFeed(feed, { signal });

      log.info(
        {
          failedReasons: failedReasons.map((reason) =>
            reason instanceof Error
              ? stdSerializers.errWithCause(reason)
              : reason,
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

  log.info("Synching ended");
};

export default runner;
