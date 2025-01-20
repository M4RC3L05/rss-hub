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

export const markAsUnread = (router: Hono) => {
  router.patch(
    "/unread",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());

      if ("feedId" in data) {
        c.get("database").sql<{ id: string }>`
          update feed_items
            set
              readed_at = null
          where
            feed_id = ${data.feedId}
            and readed_at is not null
          returning id
        `;
      }

      if ("ids" in data) {
        const idsSql = data.ids.map(() => `(id = ? and feed_id = ?)`)
          .join(" or ");

        c.get("database").prepare(`
          update feed_items
            set
              readed_at = null
          where ${idsSql}
            and readed_at is not null
          returning id
        `).run(
          ...data.ids.flatMap((x) => [x.id, x.feedId]),
        );
      }

      return c.body(null, 204);
    },
  );
};
