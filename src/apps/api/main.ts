import { HookDrain } from "../../common/process/hook-drain.ts";
import { makeLogger } from "../../common/logger/mod.ts";
import { gracefulShutdown } from "../../common/process/mod.ts";
import { makeDatabase } from "../../database/mod.ts";
import { makeApp } from "./app.ts";
import config from "config";
import FeedService from "#src/services/feed-service.ts";

const log = makeLogger("api");
const { host, port } = config.get("apps.api");
const shutdown = new HookDrain({
  log,
  onFinishDrain: (error) => {
    log.info("Exiting application");

    if (error.error) {
      if (error.reason === "timeout") {
        log.warn("Global shutdown timeout exceeded");
      }

      Deno.exit(1);
    } else {
      Deno.exit(0);
    }
  },
});

gracefulShutdown({ hookDrain: shutdown, log });

const db = makeDatabase();
const app = makeApp({
  database: db,
  shutdown: shutdown.signal,
  feedService: new FeedService(db),
});

const server = Deno.serve({
  hostname: host,
  port,
  onListen: ({ hostname, port }) => {
    log.info(`Serving on http://${hostname}:${port}`);
  },
}, app.fetch);

shutdown.registerHook({
  name: "api",
  fn: async () => {
    await server.shutdown();
  },
});

shutdown.registerHook({
  name: "db",
  fn: () => {
    db.close();
  },
});
