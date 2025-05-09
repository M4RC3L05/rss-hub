import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/web/app.tsx";
import config from "config";
import {
  CategoriesService,
  FeedItemsService,
  FeedsService,
  OpmlService,
} from "#src/apps/web/services/api/mod.ts";
import { makeServer } from "#src/apps/web/server.ts";

// Add css dep to node_modules
// deno-lint-ignore ban-ts-comment
// @ts-ignore
await import("simpledotcss").catch(() => {});

const servicesConfig = config.get<
  { api: { url: string; basicAuth: { username: string; password: string } } }
>("apps.web.services");

const { promise: shutdownPromise, signal: shutdownSignal } = gracefulShutdown();

await using _server = makeServer(
  makeApp({
    shutdown: shutdownSignal,
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
  }),
);

await shutdownPromise;
