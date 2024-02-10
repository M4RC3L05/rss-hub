import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";

const requestBodySchema = z
  .object({ id: z.string(), feedId: z.string().uuid() })
  .strict();

const handler = (router: Hono) => {
  return router.patch(
    "/unbookmark",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const data = c.req.valid("json");
      const result = c.get("database").run(
        sql`
          update feed_items set
            bookmarked_at = null
          where
              id = ${data.id}
          and feed_id = ${data.feedId}
          and bookmarked_at is not null
        `,
      );

      if (result.changes <= 0) {
        throw new HTTPException(400, {
          message: "Could not unbookmark feed item",
        });
      }

      return c.body(null, 204);
    },
  );
};

export default handler;
