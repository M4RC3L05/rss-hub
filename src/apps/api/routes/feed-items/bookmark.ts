import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";

const requestBodySchema = vine.object({
  id: vine.string(),
  feedId: vine.string().uuid(),
});
const requestBodyValidator = vine.compile(requestBodySchema);

export const bookmark = (router: Hono) => {
  router.patch(
    "/bookmark",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());

      c.get("database").sql<{ id: string }>`
        update feed_items set
          bookmarked_at = ${new Date().toISOString()}
        where
            id = ${data.id}
        and feed_id = ${data.feedId}
        returning id
      `;

      return c.body(null, 204);
    },
  );
};
