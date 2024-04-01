import type { Hono } from "hono";
import { feedsViews } from "#src/apps/web/views/mod.ts";

export const handler = (router: Hono) => {
  router.get(
    "/feeds/edit",
    async (c) => {
      const { id } = c.req.query();

      const [{ data: categories }, { data: feed }] = await Promise.all([
        c.get("services").api.categoriesService.getCategories({
          signal: c.req.raw.signal,
        }),
        c.get("services").api.feedsService.getFeedById({
          id,
          signal: c.req.raw.signal,
        }),
      ]);

      return c.html(feedsViews.pages.Edit({ categories, feed }));
    },
  );

  router.post(
    "/feeds/edit",
    async (c) => {
      const { id, ...data } = await c.req.parseBody();

      await c.get("services").api.feedsService.editFeed({
        id: id as string,
        data,
        signal: c.req.raw.signal,
      });

      return c.text("ok");
    },
  );
};
