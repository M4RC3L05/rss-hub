import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import type { FeedItemsTable } from "#src/database/types/mod.ts";

const requestQuerySchema = vine
  .object({
    bookmarked: vine.string().optional(),
    feedId: vine.string().uuid().optional(),
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

      const data = c.get("database").sql<
        FeedItemsTable & { rowid: number; totalItems: number }
      >`
        with items as (
          select rowid, *
          from feed_items
          where
            iif(
              ${query.bookmarked ?? -1} = -1,
              true,
              bookmarked_at is not null      
            )
            and
            iif(
              ${query.feedId ?? -1} = -1,
              true,
              feed_id = ${query.feedId ?? -1}
            )
            and
            iif(
              ${query.unread ?? -1} = -1,
              true,
              readed_at is null
            )
        )
        select
          i.id as id,
          i.title as title,
          i.enclosure as enclosure,
          i.link as link,
          i.img as img,
          i.content as content,
          i.feed_id as "feedId",
          i.readed_at as "readedAt",
          i.bookmarked_at as "bookmarkedAt",
          i.created_at as "createdAt",
          i.updated_at as "updatedAt",
          ti."totalItems" as "totalItems"
        from 
          items as i,
          (select count(id) as "totalItems" from items) as ti
        order by i.created_at desc, i.rowid desc
        limit ${query.limit}
        offset ${query.page * query.limit}
      `;

      return c.json({
        data,
        pagination: {
          previous: Math.max(query.page - 1, 0),
          next: Math.min(
            query.page + 1,
            Math.floor((data[0]?.totalItems ?? 0) / query.limit),
          ),
          total: data[0]?.totalItems ?? 0,
          limit: query.limit,
        },
      });
    },
  );
};
