import type { Hono } from "hono";

export const handler = (router: Hono) => {
  router.patch(
    "/feed-items/state",
    async (c) => {
      const body = await c.req.parseBody();
      const { feedId, state, ...rest } = body;

      if (["read", "unread"].includes(state as string)) {
        const ids = body["ids[]"];
        const id = ids ?? rest.id;

        const data = id
          ? {
            ids: (Array.isArray(id) ? id : [id]).map((id) => ({
              id,
              feedId,
            })) as { id: string; feedId: string }[],
          }
          : { feedId };

        await (state === "read"
          ? c
            .get("services")
            .api.feedItemsService.markFeedItemAsReaded({
              data,
              signal: c.req.raw.signal,
            })
          : c
            .get("services")
            .api.feedItemsService.markFeedItemAsUnreaded({
              data,
              signal: c.req.raw.signal,
            }));
      }

      if (["bookmark", "unbookmark"].includes(state as string)) {
        const id = body.id;

        await (state === "bookmark"
          ? c.get("services").api.feedItemsService.markFeedItemAsBookmarked({
            data: { id, feedId },
            signal: c.req.raw.signal,
          })
          : c.get("services").api.feedItemsService.markFeedItemAsUnbookmarked({
            data: { id, feedId },
            signal: c.req.raw.signal,
          }));
      }

      return c.text("ok");
    },
  );
};
