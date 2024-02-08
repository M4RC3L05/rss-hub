import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";

const requestBodySchema = z.union([
  z
    .object({ ids: z.array(z.object({ id: z.string(), feedId: z.string() })) })
    .strict(),
  z.object({ feedId: z.string().uuid() }).strict(),
]);

export const handler = (router: Hono) => {
  router.patch(
    "/api/feed-items/read",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const data = c.req.valid("json");

      const result = c.get("database").run(
        sql`
          update feed_items set
            readed_at = ${new Date().toISOString()}
          where
            $${
              "ids" in data
                ? data.ids
                    .map(
                      ({ feedId, id }) =>
                        sql`(id = ${id} and feed_id = ${feedId})`,
                    )
                    .reduce((acc, curr) => sql`$${acc} or $${curr}`)
                : sql``
            }
            $${"feedId" in data ? sql`feed_id = ${data.feedId}` : sql``}
            and readed_at is null
        `,
      );

      if (result.changes <= 0) {
        throw new HTTPException(400, {
          message: "Could not mark feed item as read",
        });
      }

      return c.body(null, 204);
    },
  );
};
