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

const generateSqlConditions = (
  data: Awaited<ReturnType<typeof requestQueryValidator["validate"]>>,
) => {
  const condParts = [];
  const bindArgs: Record<string, unknown> = {};

  if (data.bookmarked) condParts.push("bookmarked_at is not null");
  if (data.feedId) {
    condParts.push("feed_id = :feedId");
    bindArgs.feedId = data.feedId;
  }
  if (data.unread) condParts.push("readed_at is null");

  return { cond: condParts.join(" and "), bindArgs };
};

export const search = (router: Hono) => {
  router.get(
    "/",
    async (c) => {
      const query = await requestQueryValidator.validate(c.req.query());

      const { cond, bindArgs } = generateSqlConditions(query);
      const data = c.get("database").prepare(`
        with items as (
          select rowid, *
          from feed_items
          ${cond.length > 0 ? `where ${cond}` : ""}
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
          (select count(*) as "totalItems" from items) as ti
        order by i.created_at desc, i.rowid desc
        limit :limit
        offset :offset
      `).all<
        FeedItemsTable & { rowid: number; totalItems: number }
      >({ ...bindArgs, limit: query.limit, offset: query.page * query.limit });

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
