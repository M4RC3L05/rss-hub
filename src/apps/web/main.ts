import process from "node:process";
import { createAdaptorServer } from "@hono/node-server";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.js";
import { ShutdownManager } from "#src/managers/mod.js";
import makeApp from "./app.js";
import {
  CategoriesService,
  FeedItemsService,
  FeedsService,
  OpmlService,
} from "./services/api/mod.js";

const shutdownManager = new ShutdownManager();

const { port, host } = config.get<{ port: number; host: string }>("apps.web");
const log = makeLogger("web");

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
