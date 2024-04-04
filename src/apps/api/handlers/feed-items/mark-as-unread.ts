import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import vine from "@vinejs/vine";
import { makeLogger } from "#src/common/logger/mod.ts";

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
    vine.object({ feedId: vine.string() }),
  ),
]);
const requestBodyValidator = vine.compile(requestBodySchema);

const log = makeLogger("mark-as-unreaded");

const handler = (router: Hono) => {
  return router.patch(
    "/unread",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());

      const changes = c.get("database").execute(sql`
        update feed_items set
          readed_at = null
        where
          ${
        sql.if(
          "ids" in data,
          () =>
            sql`(${
              sql.join(
                (data as { ids: { feedId: string; id: string }[] }).ids.map(
                  ({ feedId, id }) => sql`(id = ${id} and feed_id = ${feedId})`,
                ),
                sql` or `,
              )
            })`,
        )
      }
          ${
        sql.if(
          "feedId" in data,
          () => sql`feed_id = ${(data as { feedId: string }).feedId}`,
        )
      }
          and readed_at is not null
      `);

      if (changes <= 0) {
        log.warn("Nothing was marked as readed");
      }

      return c.body(null, 204);
    },
  );
};

export default handler;
