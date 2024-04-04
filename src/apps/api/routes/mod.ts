import { Hono } from "hono";
import { categoriesRoutes } from "#src/apps/api/routes/categories/mod.ts";
import { feedItemsRoutes } from "#src/apps/api/routes/feed-items/mod.ts";
import { feedsRoutes } from "#src/apps/api/routes/feeds/mod.ts";
import { opmlRoutes } from "#src/apps/api/routes/opml/mod.ts";

export const router = () => {
  return new Hono()
    .route("/categories", categoriesRoutes())
    .route("/feeds", feedsRoutes())
    .route("/feed-items", feedItemsRoutes())
    .route("/opml", opmlRoutes());
};
