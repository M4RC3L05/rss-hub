import type { Hono } from "@hono/hono";
import { decodeBase64Url } from "@std/encoding/base64url";

export const update = (router: Hono) => {
  router.post(
    "/state",
    async (c) => {
      const body = await c.req.parseBody();
      const { redirect } = c.req.query();
      const { feedId, state, ...rest } = body;

      if (["read", "unread"].includes(state as string)) {
        const ids = body["id[]"];
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

      return c.redirect(
        redirect
          ? new TextDecoder().decode(decodeBase64Url(redirect))
          : c.req.header("Referer") ??
            `/feed-items?feedId=${feedId}`,
      );
    },
  );
};
