import { Hono } from "hono";
import * as categoriesRouter from "#src/apps/api/handlers/categories/mod.ts";
import * as feedItemsRouter from "#src/apps/api/handlers/feed-items/mod.ts";
import * as feedsRouter from "#src/apps/api/handlers/feeds/mod.ts";
import * as opmlRouter from "#src/apps/api/handlers/opml/mod.ts";

export const handlersRouter = () => {
  return new Hono()
    .route("/categories", categoriesRouter.router())
    .route("/feeds", feedsRouter.router())
    .route("/feed-items", feedItemsRouter.router())
    .route("/opml", opmlRouter.router());
};
