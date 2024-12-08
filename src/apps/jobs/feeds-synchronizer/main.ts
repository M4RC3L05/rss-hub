import { makeLogger } from "#src/common/logger/mod.ts";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { FeedService } from "#src/services/mod.ts";
import runner from "#src/apps/jobs/feeds-synchronizer/app.ts";
import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";
import { gracefulShutdown } from "#src/common/process/mod.ts";

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
    const job = async () => {
      if (Deno.env.get("BUILD_DRY_RUN") === "true") return;

      try {
        log.info("Running feeds-synchronizer");

        await runner({
          signal: pc.signal,
          db,
          feedService: new FeedService(db),
        });
      } catch (error) {
        log.error(error, "Error running feeds-synchronizer task");
      } finally {
        log.info("feeds-synchronizer completed");
      }
    };

    return { job: job() };
  },
  shutdown: ({ job }) => job,
});

await processLifecycle.boot();

if (Deno.env.get("BUILD_DRY_RUN") === "true") {
  await processLifecycle.shutdown();
}
