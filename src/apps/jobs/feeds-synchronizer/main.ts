import { makeLogger } from "#src/common/logger/mod.ts";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { FeedService } from "#src/services/mod.ts";
import runner from "#src/apps/jobs/feeds-synchronizer/app.ts";
import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { delay } from "@std/async";

const log = makeLogger("feeds-synchronizer");

const processLifecycle = new ProcessLifecycle();

gracefulShutdown({ processLifecycle, log });

processLifecycle.registerService({
  name: "db",
  boot: () => makeDatabase(),
  shutdown: (db) => db.close(),
});

processLifecycle.registerService({
  name: "job",
  boot: (pc) => {
    const db = pc.getService<CustomDatabase>("db");
    const ac = new AbortController();
    const job = async () => {
      try {
        log.info("Running feeds-synchronizer");

        await runner({
          signal: ac.signal,
          db,
          feedService: new FeedService(db),
        });
      } catch (error) {
        log.error(error, "Error running feeds-synchronizer task");
      } finally {
        log.info("feeds-synchronizer completed");
      }
    };

    return {
      job: delay(0, { signal: ac.signal }).then(() => job(), (error) => {
        log.warn("Something stopped deferred delay", { error });
      }),
      ac,
    };
  },
  shutdown: async ({ ac, job }) => {
    if (!ac.signal.aborted) {
      ac.abort();
    }

    await Promise.allSettled([job]);
  },
});

await processLifecycle.boot();
