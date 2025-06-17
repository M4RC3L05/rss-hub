import pineSerializer from "pino-std-serializers";
import { makeLogger } from "#src/common/logger/mod.ts";
import type { CustomDatabase, FeedsTable } from "#src/database/mod.ts";
import type { FeedService } from "#src/services/mod.ts";

const log = makeLogger("feed-synchronizer-runner");

const runner = async ({
  signal,
  feedService,
  db,
}: { signal?: AbortSignal; db: CustomDatabase; feedService: FeedService }) => {
  if (signal?.aborted) {
    return;
  }

  const feeds = db.sql<FeedsTable>`select * from feeds`;

  log.info("Synching begin");

  for (const feed of feeds) {
    if (signal?.aborted) {
      log.info("Abort sync");

      break;
    }

    log.info(`Synching feed ${feed.url}`, { feed });

    try {
      const { faildCount, failedReasons, successCount, totalCount } =
        await feedService.syncFeed(feed, signal ? { signal } : undefined);

      log.info(
        `Done processing ${feed.url}, ${totalCount} items, with ${successCount} succeeded and ${faildCount} failed`,
        {
          failedReasons: failedReasons.map((reason: unknown) =>
            reason instanceof Error
              ? pineSerializer.errWithCause(reason)
              : reason
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
