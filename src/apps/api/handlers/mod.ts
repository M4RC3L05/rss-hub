import { type Hono } from "hono";
import * as categoriesHandlers from "./categories/mod.js";
import * as feedItemsHandlers from "./feed-items/mod.js";
import * as feedsHandlers from "./feeds/mod.js";
import * as opmlHandlers from "./opml/mod.js";

export const handler = (router: Hono) => {
  categoriesHandlers.handler(router);
  feedsHandlers.handler(router);
  feedItemsHandlers.handler(router);
  opmlHandlers.handler(router);
};
