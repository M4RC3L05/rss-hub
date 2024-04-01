import { sql } from "@m4rc3l05/sqlite-tag";
import { formatError, makeLogger } from "#src/common/logger/mod.ts";
import type { CustomDatabase } from "#src/database/mod.ts";
import type { FeedsTable } from "#src/database/types/mod.ts";
import type { FeedService } from "#src/services/mod.ts";

const log = makeLogger("feed-synchronizer-runner");

const runner = async ({
  signal,
  feedService,
  db,
}: { signal?: AbortSignal; db: CustomDatabase; feedService: FeedService }) => {
  const feeds = db.all<FeedsTable>(sql`select * from feeds`);

  log.info("Synching begin");

  for (const feed of feeds) {
    log.info(`Synching feed ${feed.url}`, { feed });

    try {
      const { faildCount, failedReasons, successCount, totalCount } =
        await feedService.syncFeed(feed, { signal });

      log.info(
        `Done processing ${feed.url}, ${totalCount} items, with ${successCount} succeeded and ${faildCount} failed`,
        {
          failedReasons: failedReasons.map((reason) =>
            reason instanceof Error ? formatError(reason) : reason
          ),
          faildCount,
          successCount,
          totalCount,
          feed,
        },
      );
    } catch (error) {
      log.error(`Sync failed ${feed.url}`, { error });
    } finally {
      log.info(`Synching synced ${feed.url}`, { feed });
    }

    if (signal?.aborted) {
      break;
    }
  }

  log.info("Synching ended");
};

export default runner;
