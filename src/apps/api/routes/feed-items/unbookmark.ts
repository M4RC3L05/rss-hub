import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";

const requestBodySchema = vine.object({
  id: vine.string(),
  feedId: vine.string().uuid(),
});
const requestBodyValidator = vine.compile(requestBodySchema);

export const unbookmark = (router: Hono) => {
  router.patch(
    "/unbookmark",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());

      c.get("database").sql`
        update feed_items set
          bookmarked_at = null
        where
            id = ${data.id}
        and feed_id = ${data.feedId}
        and bookmarked_at is not null
      `;

      return c.body(null, 204);
    },
  );
};
