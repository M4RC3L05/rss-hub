import sql from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";
import { type RouteMiddleware } from "@m4rc3l05/sss";
import { type FeedItemsTable } from "../../../../database/types/mod.js";
import { db } from "../../../../database/mod.js";

export const schemas = {
  request: {
    query: {
      $id: "get-feed-items-request-query",
      type: "object",
      properties: {
        feedId: { type: "string", format: "uuid" },
        unread: { type: "string" },
        page: { type: "string", pattern: "^[0-9]+$" },
        limit: { type: "string", pattern: "^[0-9]+$" },
      },
      additionalProperties: false,
      required: ["feedId", "page", "limit"],
    },
  },
} as const;

type RequestQuery = FromSchema<(typeof schemas)["request"]["query"]>;

export const handler: RouteMiddleware = (request, response) => {
  const query = request.searchParams as RequestQuery;
  const feedItems = db.all<FeedItemsTable>(
    sql`
      select * from feed_items
      where
        feed_id = ${query.feedId}
        $${"unread" in query ? sql`and readed_at is null` : sql``}
      order by created_at desc
      limit ${Number(query.limit)}
      offset ${Number(query.page) * Number(query.limit)}
    `,
  );

  response.statusCode = 200;

  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ data: feedItems }));
};
