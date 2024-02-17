import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { FeedItemsTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestParamsSchema = z
  .object({ feedId: z.string(), id: z.string() })
  .strict();

const handler = (router: Hono) => {
  return router.get(
    "/:id/:feedId",
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

export default handler;
