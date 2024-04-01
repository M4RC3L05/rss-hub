import type { Hono } from "hono";
import { feedsViews } from "#src/apps/web/views/mod.ts";

export const handler = (router: Hono) => {
  router.get("/", async (c) => {
    const [{ data: categories }, { data: feeds }] = await Promise.all([
      c.get("services").api.categoriesService.getCategories({
        signal: c.req.raw.signal,
      }),
      c.get("services").api.feedsService.getFeeds({ signal: c.req.raw.signal }),
    ]);

    return c.html(feedsViews.pages.Index({ categories, feeds }));
  });
};
