import type { Hono } from "hono";
import { feedsViews } from "#src/apps/web/views/mod.ts";

export const handler = (router: Hono) => {
  router.get("/feeds/create", async (c) => {
    const { data: categories } = await c.get("services").api.categoriesService
      .getCategories({ signal: c.req.raw.signal });

    return c.html(feedsViews.pages.Create({ categories }));
  });

  router.post(
    "/feeds/create",
    async (c) => {
      const data = await c.req.parseBody();

      await c.get("services").api.feedsService.createFeed({
        data,
        signal: c.req.raw.signal,
      });

      return c.text("ok");
    },
  );
};
