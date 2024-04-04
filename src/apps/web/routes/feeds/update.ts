import type { Hono } from "hono";
import { feedsViews } from "#src/apps/web/views/mod.ts";

export const update = (router: Hono) => {
  router.get(
    "/:id/edit",
    async (c) => {
      const { id } = c.req.param();

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
    "/:id/edit",
    async (c) => {
      const { id } = c.req.param();
      const data = await c.req.parseBody();

      const { data: feed } = await c.get("services").api.feedsService
        .getFeedById({
          id,
          signal: c.req.raw.signal,
        });

      if (feed.url !== data.url) {
        const { data: { title } } = await c.get("services").api.feedsService
          .verifyUrl({ data: { url: data.url }, signal: c.req.raw.signal });

        if (typeof data.name === "string" && data.name.length <= 0) {
          data.name = title;
        }
      }

      await c.get("services").api.feedsService.editFeed({
        id,
        data,
        signal: c.req.raw.signal,
      });

      return c.redirect(`/feed-items?feedId=${id}`);
    },
  );
};
