import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import vine from "@vinejs/vine";
import type { FeedItemsTable } from "#src/database/types/mod.ts";

const requestParametersSchema = vine.object({
  feedId: vine.string().uuid(),
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

      const [feedItem] = c.get("database").sql<FeedItemsTable>`
        select 
          id, title, enclosure, link, img, content,
          feed_id as "feedId",
          readed_at as "readedAt",
          bookmarked_at as "bookmarkedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"  
        from feed_items
        where id = ${id} and feed_id = ${feedId}
      `;

      if (!feedItem) {
        throw new HTTPException(404, {
          message: "Could not fund feed item",
        });
      }

      return c.json({ data: feedItem });
    },
  );
};
