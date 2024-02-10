import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";

const requestFormSchema = z
  .object({
    feedId: z.string(),
    id: z.string().optional(),
    "id[]": z.any().optional(),
    state: z.enum(["read", "unread", "bookmark", "unbookmark"]),
  })
  .strict();

export const handler = (router: Hono) => {
  router.patch(
    "/feed-items/state",
    zValidator("form", requestFormSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const body = c.req.valid("form");
      const { feedId, state, ...rest } = body;

      if (["read", "unread"].includes(state)) {
        const ids = (await c.req.parseBody())["id[]"];
        const id = ids ?? rest.id;

        const data = id
          ? {
              ids: (Array.isArray(id) ? id : [id]).map((id) => ({
                id,
                feedId,
              })) as { id: string; feedId: string }[],
            }
          : { feedId };

        console.log("data", data);

        await (state === "read"
          ? c
              .get("services")
              .api.feedItemsService.markFeedItemAsReaded({ data })
          : c
              .get("services")
              .api.feedItemsService.markFeedItemAsUnreaded({ data }));
      }

      if (["bookmark", "unbookmark"].includes(state)) {
        const id = (body as { id: string }).id;

        await (state === "bookmark"
          ? c.get("services").api.feedItemsService.markFeedItemAsBookmarked({
              data: { id, feedId },
            })
          : c.get("services").api.feedItemsService.markFeedItemAsUnbookmarked({
              data: { id, feedId },
            }));
      }

      return c.text("ok");
    },
  );
};
