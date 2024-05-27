import type { Hono } from "@hono/hono";
import { FeedItemsReadabilityPage } from "#src/apps/web/views/feed-items/pages/readability.tsx";

export const readability = (router: Hono) => {
  router.get(
    "/:id/:feedId/readability",
    async (c) => {
      const { id, feedId } = c.req.param();

      const [{ data: feedItem }, { data: page }] = await Promise.all([
        await c.get("services").api.feedItemsService
          .getFeedItemById({ feedId, id, signal: c.req.raw.signal }),
        await c.get("services").api.feedItemsService
          .feedItemReadability({ feedId, id, signal: c.req.raw.signal }),
      ]);

      feedItem.content = page;

      return c.render(<FeedItemsReadabilityPage feedItem={feedItem} />);
    },
  );
};
