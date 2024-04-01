import type { Hono } from "hono";
import { feedItemsViews } from "../../views/mod.ts";

export const handler = (router: Hono) => {
  router.get(
    "/feed-items/show",
    async (c) => {
      const { id, feedId } = c.req.query();

      const { data: feedItem } = await c
        .get("services")
        .api.feedItemsService.getFeedItemById({
          feedId,
          id,
          signal: c.req.raw.signal,
        });

      return c.html(
        feedItemsViews.pages.Show({
          feedItem: feedItem,
        }),
      );
    },
  );
};
