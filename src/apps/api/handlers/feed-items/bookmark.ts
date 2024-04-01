import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import vine from "@vinejs/vine";

const requestBodySchema = vine.object({
  id: vine.string(),
  feedId: vine.string().uuid(),
});
const requestBodyValidator = vine.compile(requestBodySchema);

const handler = (router: Hono) => {
  return router.patch(
    "/bookmark",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());
      const changes = c.get("database").execute(
        sql`
          update feed_items set
            bookmarked_at = ${new Date().toISOString()}
          where
              id = ${data.id}
          and feed_id = ${data.feedId}
          and bookmarked_at is null
        `,
      );

      if (changes <= 0) {
        throw new HTTPException(400, {
          message: "Could not bookmark feed item",
        });
      }

      return c.body(null, 204);
    },
  );
};

export default handler;
