import { Buffer } from "node:buffer";
import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { FeedItemsTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestParamsSchema = z
  .object({ feedId: z.string(), id: z.string() })
  .strict();

export const handler = (router: Hono) => {
  router.get(
    "/api/feed-items/:id/:feedId",
    zValidator("param", requestParamsSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const { feedId, id } = c.req.valid("param");

      const feedItem = c.get("database").get<FeedItemsTable>(
        sql`
          select * from feed_items
          where id = ${id} and feed_id = ${feedId}
        `,
      );

      if (!feedItem) {
        throw new HTTPException(404, {
          message: "Could not fund feed item",
        });
      }

      return c.json({ data: feedItem });
    },
  );
};
