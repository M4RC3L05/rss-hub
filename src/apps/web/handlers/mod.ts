import type { Hono } from "hono";
import * as categoriesHandler from "./categories/mod.ts";
import * as feedItemsHandler from "./feed-items/mod.ts";
import * as feedsHandler from "./feeds/mod.ts";
import * as opmlHandlers from "./opml/mod.ts";
import * as pagesHandlers from "./pages/mod.ts";

export const handler = (router: Hono) => {
  categoriesHandler.handler(router);
  feedItemsHandler.handler(router);
  feedsHandler.handler(router);
  opmlHandlers.handler(router);
  pagesHandlers.handler(router);
};
