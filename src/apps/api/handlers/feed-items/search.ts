import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import { z } from "zod";
import type { FeedItemsTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestQuerySchema = z
  .object({
    bookmarked: z.string().optional(),
    feedId: z.string().uuid(),
    unread: z.string().optional(),
    page: z.string().optional().default("0"),
    limit: z.string().optional().default("10"),
  })
  .strict();

const handler = (router: Hono) => {
  return router.get(
    "/",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { query: result.error } });
    }),
    (c) => {
      const query = c.req.valid("query");
      const feedItemsQuery = sql`
        select rowid, * from feed_items
        where
          feed_id = ${query.feedId}
          ${sql.if("unread" in query, () => sql`and readed_at is null`)}
          ${sql.if(
            "bookmarked" in query,
            () => sql`and bookmarked_at is not null`,
          )}
        order by created_at desc, rowid desc
      `;
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const { total } = c.get("database").get<{ total: number }>(sql`
        select count(id) as total
        from (${feedItemsQuery})
      `)!;
      const feedItems = c
        .get("database")
        .all<FeedItemsTable & { rowid: number }>(sql`
          ${feedItemsQuery}
          limit ${Number(query.limit)}
          offset ${Number(query.page) * Number(query.limit)}
        `);

      return c.json({
        data: feedItems,
        pagination: {
          previous: Math.max(Number(query.page) - 1, 0),
          next: Math.min(
            Number(query.page) + 1,
            Math.floor(total / Number(query.limit)),
          ),
          total,
          limit: Number(query.limit),
        },
      });
    },
  );
};

export default handler;
