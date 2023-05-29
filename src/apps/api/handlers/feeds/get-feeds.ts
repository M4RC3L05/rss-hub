import type Router from "@koa/router";
import sql, { type Database } from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";
import { type FeedsTable } from "../../../../database/types/mod.js";

type GetFeedsDeps = {
  db: Database;
};

export const schemas = {
  request: {
    query: {
      $id: "get-feeds-request-query",
      type: "object",
      properties: { categoryId: { type: "string", format: "uuid" } },
      additionalProperties: false,
    },
  },
} as const;

type RequestQuery = FromSchema<(typeof schemas)["request"]["query"]>;

export const handler = (deps: GetFeedsDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const query = ctx.query as RequestQuery;
    const feeds = deps.db.all<FeedsTable>(sql`
      select f.*, count(fi.id) as "unreadCount"
      from feeds f
      left join feed_items fi on f.id = fi.feed_id and fi.readed_at is null
      $${query.categoryId ? sql`where f.category_id = ${query.categoryId}` : sql``}
      group by f.id
      order by f.name collate nocase asc
    `);

    ctx.body = { data: feeds };
  };
};
