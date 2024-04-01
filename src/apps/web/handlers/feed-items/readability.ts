import type { Hono } from "hono";

export const handler = (router: Hono) => {
  router.get(
    "/feed-items/readability",
    async (c) => {
      const { id, feedId, readability } = c.req.query();

      const { data } = readability && readability === "true"
        ? await c
          .get("services")
          .api.feedItemsService.feedItemReadability({
            feedId,
            id,
            signal: c.req.raw.signal,
          })
        : await c
          .get("services")
          .api.feedItemsService.getFeedItemById({
            feedId,
            id,
            signal: c.req.raw.signal,
          });

      return c.html(typeof data === "string" ? data : data.content);
    },
  );
};
