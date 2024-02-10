import type { Hono } from "hono";
import * as categoriesHandler from "./categories/mod.js";
import * as feedItemsHandler from "./feed-items/mod.js";
import * as feedsHandler from "./feeds/mod.js";
import * as opmlHandlers from "./opml/mod.js";
import * as pagesHandlers from "./pages/mod.js";

export const handler = (router: Hono) => {
  categoriesHandler.handler(router);
  feedItemsHandler.handler(router);
  feedsHandler.handler(router);
  opmlHandlers.handler(router);
  pagesHandlers.handler(router);
};
