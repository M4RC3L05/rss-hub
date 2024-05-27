import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import type { FeedItemsTable } from "#src/database/types/mod.ts";

const requestQuerySchema = vine
  .object({
    bookmarked: vine.string().optional(),
    feedId: vine.string().uuid(),
    unread: vine.string().optional(),
    page: vine.number().parse((value) => value ?? 0),
    limit: vine.number().parse((value) => value ?? 10),
  });
const requestQueryValidator = vine.compile(requestQuerySchema);

export const search = (router: Hono) => {
  router.get(
    "/",
    async (c) => {
      const query = await requestQueryValidator.validate(c.req.query());
      const feedItemsQuery = sql`
        select rowid, * from feed_items
        where
          feed_id = ${query.feedId}
          ${sql.if("unread" in query, () => sql`and readed_at is null`)}
          ${
        sql.if(
          "bookmarked" in query,
          () => sql`and bookmarked_at is not null`,
        )
      }
        order by created_at desc, rowid desc
      `;

      const { total } = c.get("database").get<{ total: number }>(sql`
        select count(id) as total
        from (${feedItemsQuery})
      `)!;
      const feedItems = c
        .get("database")
        .all<FeedItemsTable & { rowid: number }>(sql`
          ${feedItemsQuery}
          limit ${query.limit}
          offset ${query.page * query.limit}
        `);

      return c.json({
        data: feedItems,
        pagination: {
          previous: Math.max(query.page - 1, 0),
          next: Math.min(
            query.page + 1,
            Math.floor(total / query.limit),
          ),
          total,
          limit: query.limit,
        },
      });
    },
  );
};
