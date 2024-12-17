import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";

const requestBodySchema = vine.union([
  vine.union.if(
    (data) => "ids" in data,
    vine.object({
      ids: vine.array(vine.object({ id: vine.string(), feedId: vine.string() }))
        .minLength(1),
    }),
  ),
  vine.union.if(
    (data) => "feedId" in data,
    vine.object({ feedId: vine.string().uuid() }),
  ),
]).otherwise((_, field) => {
  field.report(
    "Either feedId or ids",
    "feed_id_or_ids",
    field,
  );
});

const requestBodyValidator = vine.compile(requestBodySchema);

export const markAsRead = (router: Hono) => {
  router.patch(
    "/read",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());

      if ("feedId" in data) {
        c.get("database").sql<{ id: string }>`
          update feed_items
            set
              readed_at = ${new Date().toISOString()}
          where
            feed_id = ${data.feedId} and readed_at is null
          returning id
        `;
      }

      if ("ids" in data) {
        for (const { id, feedId } of data.ids) {
          c.get("database").sql<{ id: string }>`
            update feed_items
              set
                readed_at = ${new Date().toISOString()}
            where
              id = ${id} and feed_id = ${feedId} and readed_at is null
            returning id
          `[0];
        }
      }

      return c.body(null, 204);
    },
  );
};
