import { Hono } from "hono";
import { categoriesRoutes } from "#src/apps/web/routes/categories/mod.ts";
import { feedItemsRoutes } from "#src/apps/web/routes/feed-items/mod.ts";
import { feedsRoutes } from "#src/apps/web/routes/feeds/mod.ts";
import { opmlRoutes } from "#src/apps/web/routes/opml/mod.ts";
import { pagesRoutes } from "#src/apps/web/routes/pages/mod.ts";

export const router = () => {
  return new Hono()
    .route("/", pagesRoutes())
    .route("/categories", categoriesRoutes())
    .route("/feed-items", feedItemsRoutes())
    .route("/feeds", feedsRoutes())
    .route("/opml", opmlRoutes());
};
