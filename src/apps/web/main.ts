import { HookDrain } from "#src/common/process/hook-drain.ts";
import { makeLogger } from "#src/common/logger/mod.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/web/app.ts";
import config from "config";
import {
  CategoriesService,
  FeedItemsService,
  FeedsService,
  OpmlService,
} from "#src/apps/web/services/api/mod.ts";

const log = makeLogger("web");
const { host, port } = config.get("apps.web");
const servicesConfig = config.get("apps.web.services");

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

const app = makeApp({
  shutdown: shutdown.signal,
  services: {
    api: {
      categoriesService: new CategoriesService(
        servicesConfig.api.url,
        servicesConfig.api.basicAuth,
      ),
      feedItemsService: new FeedItemsService(
        servicesConfig.api.url,
        servicesConfig.api.basicAuth,
      ),
      feedsService: new FeedsService(
        servicesConfig.api.url,
        servicesConfig.api.basicAuth,
      ),
      opmlService: new OpmlService(
        servicesConfig.api.url,
        servicesConfig.api.basicAuth,
      ),
    },
  },
});

const server = Deno.serve({
  hostname: host,
  port,
  onListen: ({ hostname, port }) => {
    log.info(`Serving on http://${hostname}:${port}`);
  },
}, app.fetch);

shutdown.registerHook({
  name: "web",
  fn: async () => {
    await server.shutdown();
  },
});
