import type { Hono } from "hono";
import { feedsViews } from "../../views/mod.js";

export const handler = (router: Hono) => {
  router.get("/", async (c) => {
    const [{ data: categories }, { data: feeds }] = await Promise.all([
      c.get("services").api.categoriesService.getCategories(),
      c.get("services").api.feedsService.getFeeds(),
    ]);

    return c.html(feedsViews.pages.Index({ categories, feeds }));
  });
};
