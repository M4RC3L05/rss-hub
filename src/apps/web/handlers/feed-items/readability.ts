import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";

const requestQuerySchema = z
  .object({
    feedId: z.string(),
    id: z.string(),
    readability: z.string().optional(),
  })
  .strict();

export const handler = (router: Hono) => {
  router.get(
    "/feed-items/readability",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const { id, feedId, readability } = c.req.valid("query");

      const { data } =
        readability && readability === "true"
          ? await c
              .get("services")
              .api.feedItemsService.feedItemReadability({ feedId, id })
          : await c
              .get("services")
              .api.feedItemsService.getFeedItemById({ feedId, id });

      return c.html(typeof data === "string" ? data : data.content);
    },
  );
};
