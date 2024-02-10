import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";
import { feedItemsViews } from "../../views/mod.js";

const requestQuerySchema = z
  .object({
    feedId: z.string(),
    id: z.string(),
  })
  .strict();

export const handler = (router: Hono) => {
  router.get(
    "/feed-items/show",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const { id, feedId } = c.req.valid("query");

      const { data: feedItem } = await c
        .get("services")
        .api.feedItemsService.getFeedItemById({ feedId, id });

      return c.html(
        feedItemsViews.pages.Show({
          feedItem: feedItem,
        }),
      );
    },
  );
};
