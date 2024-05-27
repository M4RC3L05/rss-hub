import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import vine from "@vinejs/vine";
import type { FeedItemsTable } from "#src/database/types/mod.ts";

const requestParametersSchema = vine.object({
  feedId: vine.string(),
  id: vine.string(),
});
const requestParametersValidator = vine.compile(requestParametersSchema);

export const get = (router: Hono) => {
  router.get(
    "/:id/:feedId",
    async (c) => {
      const { feedId, id } = await requestParametersValidator.validate(
        c.req.param(),
      );

      const feedItem = c.get("database").get<FeedItemsTable>(
        sql`
          select * from feed_items
          where id = ${decodeURIComponent(id)} and feed_id = ${feedId}
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
