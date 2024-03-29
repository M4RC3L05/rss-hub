import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";

const requestBodySchema = z
  .object({ id: z.string(), feedId: z.string().uuid() })
  .strict();

const handler = (router: Hono) => {
  return router.patch(
    "/bookmark",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const data = c.req.valid("json");
      const result = c.get("database").run(
        sql`
          update feed_items set
            bookmarked_at = ${new Date().toISOString()}
          where
              id = ${data.id}
          and feed_id = ${data.feedId}
          and bookmarked_at is null
        `,
      );

      if (result.changes <= 0) {
        throw new HTTPException(400, {
          message: "Could not bookmark feed item",
        });
      }

      return c.body(null, 204);
    },
  );
};

export default handler;
