import type Router from "@koa/router";
import sql, { type Database } from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";
import { type FeedItemsTable } from "../../../../database/types/mod.js";

type GetFeedItemsDeps = {
  db: Database;
};

export const schemas = {
  request: {
    query: {
      $id: "get-feed-items-request-query",
      type: "object",
      properties: { feedId: { type: "string", format: "uuid" }, unread: { type: "string" } },
      additionalProperties: false,
      required: ["feedId"],
    },
  },
} as const;

type RequestQuery = FromSchema<(typeof schemas)["request"]["query"]>;

export const handler = (deps: GetFeedItemsDeps): Router.Middleware => {
  return (ctx: Router.RouterContext) => {
    const query = ctx.query as RequestQuery;
    const feedItems = deps.db.all<FeedItemsTable>(
      sql`
        select * from feed_items
        where
          feed_id = ${query.feedId}
          $${"unread" in query ? sql`and readed_at is null` : sql``}
        order by created_at desc
      `,
    );

    ctx.body = { data: feedItems };
  };
};
