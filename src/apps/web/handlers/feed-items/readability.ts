import type { Hono } from "hono";
import { feedItemsViews } from "#src/apps/web/views/mod.ts";

export const handler = (router: Hono) => {
  router.get(
    "/feed-items/:id/:feedId/readability",
    async (c) => {
      const { id, feedId } = c.req.param();

      const [{ data: feedItem }, { data: page }] = await Promise.all([
        await c.get("services").api.feedItemsService
          .getFeedItemById({ feedId, id, signal: c.req.raw.signal }),
        await c.get("services").api.feedItemsService
          .feedItemReadability({ feedId, id, signal: c.req.raw.signal }),
      ]);

      feedItem.content = page;

      return c.html(feedItemsViews.pages.Readability({ feedItem }));
    },
  );
};
