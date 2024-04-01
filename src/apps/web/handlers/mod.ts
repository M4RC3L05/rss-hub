import type { Hono } from "hono";
import * as categoriesHandler from "#src/apps/web/handlers/categories/mod.ts";
import * as feedItemsHandler from "#src/apps/web/handlers/feed-items/mod.ts";
import * as feedsHandler from "#src/apps/web/handlers/feeds/mod.ts";
import * as opmlHandlers from "#src/apps/web/handlers/opml/mod.ts";
import * as pagesHandlers from "#src/apps/web/handlers/pages/mod.ts";

export const handler = (router: Hono) => {
  categoriesHandler.handler(router);
  feedItemsHandler.handler(router);
  feedsHandler.handler(router);
  opmlHandlers.handler(router);
  pagesHandlers.handler(router);
};
