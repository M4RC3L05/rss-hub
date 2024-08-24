import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";
import { makeLogger } from "#src/common/logger/mod.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/web/app.tsx";
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

const processLifecycle = new ProcessLifecycle();

gracefulShutdown({ processLifecycle, log });

processLifecycle.registerService({
  name: "web",
  boot: (pl) => {
    const app = makeApp({
      shutdown: pl.signal,
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

    return server;
  },
  shutdown: (server) => server.shutdown(),
});

await processLifecycle.boot();
