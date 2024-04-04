import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import vine from "@vinejs/vine";
import { makeLogger } from "#src/common/logger/mod.ts";

const requestBodySchema = vine.object({
  id: vine.string(),
  feedId: vine.string().uuid(),
});
const requestBodyValidator = vine.compile(requestBodySchema);

const log = makeLogger("unbookmark");

const handler = (router: Hono) => {
  return router.patch(
    "/unbookmark",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());
      const changes = c.get("database").execute(
        sql`
          update feed_items set
            bookmarked_at = null
          where
              id = ${data.id}
          and feed_id = ${data.feedId}
          and bookmarked_at is not null
        `,
      );

      if (changes <= 0) {
        log.warn("Nothing was unbookmarked");
      }

      return c.body(null, 204);
    },
  );
};

export default handler;
