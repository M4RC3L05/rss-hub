import type { Hono } from "hono";
import { FeedItemsShowPage } from "#src/apps/web/views/feed-items/pages/show.tsx";

export const show = (router: Hono) => {
  router.get(
    "/:id/:feedId",
    async (c) => {
      const { id, feedId } = c.req.param();

      const { data: feedItem } = await c.get("services").api.feedItemsService
        .getFeedItemById({ feedId, id, signal: c.req.raw.signal });

      return c.render(<FeedItemsShowPage feedItem={feedItem} />);
    },
  );
};
