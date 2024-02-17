import process from "node:process";
import { createAdaptorServer } from "@hono/node-server";
import { ShutdownManager } from "@m4rc3l05/shutdown-manager";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.js";
import makeApp from "./app.js";
import {
  CategoriesService,
  FeedItemsService,
  FeedsService,
  OpmlService,
} from "./services/api/mod.js";

const { port, host } = config.get<{ port: number; host: string }>("apps.web");
const log = makeLogger("web");

const shutdownManager = new ShutdownManager({ log: log });

const app = makeApp({
  services: {
    api: {
      categoriesService: new CategoriesService(),
      opmlService: new OpmlService(),
      feedItemsService: new FeedItemsService(),
      feedsService: new FeedsService(),
    },
  },
});
const server = createAdaptorServer(app);

server.listen({ port, hostname: host }, () => {
  log.info(`Listening on ${host}:${port}`);

  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});

shutdownManager.addHook("web", async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});
