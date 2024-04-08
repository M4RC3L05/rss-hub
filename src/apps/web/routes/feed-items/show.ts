import type { Hono } from "hono";
import { feedItemsViews } from "#src/apps/web/views/mod.ts";

export const show = (router: Hono) => {
  router.get(
    "/:id/:feedId",
    async (c) => {
      const { id, feedId } = c.req.param();

      const { data: feedItem } = await c.get("services").api.feedItemsService
        .getFeedItemById({ feedId, id, signal: c.req.raw.signal });

      return c.html(feedItemsViews.pages.Show({ feedItem: feedItem }));
    },
  );
};