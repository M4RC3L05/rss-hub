import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { RequestValidationError } from "../../../../errors/mod.js";

const requestBodySchema = z.object({ id: z.string() }).strict();

export const handler = (router: Hono) => {
  router.patch(
    "/api/feed-items/unread",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const data = c.req.valid("json");
      const result = c.get("database").run(sql`
        update feed_items set
          readed_at = null
        where
          readed_at is not null
          $${"id" in data ? sql`and id = ${data.id}` : sql``}
      `);

      if (result.changes <= 0) {
        throw new HTTPException(400, {
          message: "Could not mark feed item as unread",
        });
      }

      return c.body(null, 204);
    },
  );
};
