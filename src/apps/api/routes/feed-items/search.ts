import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import type { FeedItemsTable } from "#src/database/types/mod.ts";
import type { RestBindParameters } from "@db/sqlite";

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
      const baseSelect = `
        select
          id as id,
          title as title,
          enclosure as enclosure,
          link as link,
          img as img,
          content as content,
          feed_id as "feedId",
          readed_at as "readedAt",
          bookmarked_at as "bookmarkedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from feed_items
        ${cond.length > 0 ? `where ${cond}` : ""}
        order by created_at desc, rowid desc
      `;
      const data = c.get("database").prepare(`
        ${baseSelect}
        limit :limit
        offset :offset
      `).all<
        FeedItemsTable & { rowid: number }
      >({ ...bindArgs, limit: query.limit, offset: query.page * query.limit });

      const { totalItems } = c.get("database").prepare(
        `select count(*) as "totalItems" from (${baseSelect})`,
      ).get<FeedItemsTable & { rowid: number; totalItems: number }>({
        ...bindArgs,
      } as unknown as RestBindParameters)!;

      return c.json({
        data,
        pagination: {
          previous: Math.max(query.page - 1, 0),
          next: Math.min(
            query.page + 1,
            Math.floor((totalItems ?? 0) / query.limit),
          ),
          total: totalItems ?? 0,
          limit: query.limit,
        },
      });
    },
  );
};
