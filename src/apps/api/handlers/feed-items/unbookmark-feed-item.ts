import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { RequestValidationError } from "../../../../errors/mod.js";

const requestParamsSchema = z.object({ id: z.string() }).strict();

export const handler = (router: Hono) => {
  router.patch(
    "/api/feed-items/:id/unbookmark",
    zValidator("param", requestParamsSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const data = c.req.valid("param");
      const result = c.get("database").run(
        sql`
          update feed_items set
            bookmarked_at = null
          where
              id = ${data.id}
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
