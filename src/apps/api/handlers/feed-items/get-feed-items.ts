import { Buffer } from "node:buffer";
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
        nextCursor: { type: "string" },
        limit: { type: "string", pattern: "^[0-9]+$" },
      },
      additionalProperties: false,
      required: ["feedId"],
    },
  },
} as const;

type RequestQuery = FromSchema<(typeof schemas)["request"]["query"]>;

export const handler: RouteMiddleware = (request, response) => {
  const query = request.searchParams as RequestQuery;
  let parsedCursor: { rowId: number; createdAt: string } | undefined;

  if (query.nextCursor) {
    const [rowId, createdAt] = Buffer.from(decodeURIComponent(query.nextCursor), "base64")
      .toString("utf8")
      .split("@@");
    parsedCursor = { createdAt, rowId: Number(rowId) };
  }

  const feedItems = db.all<FeedItemsTable & { rowid: number }>(
    sql`
      select rowid, * from feed_items
      where
        (
          feed_id = ${query.feedId}
          $${"unread" in query ? sql`and readed_at is null` : sql``}
        )
        $${
          parsedCursor
            ? sql`
              and (
                (created_at = ${parsedCursor.createdAt} and rowid < ${parsedCursor.rowId})
                or created_at < ${parsedCursor.createdAt}
              )
            `
            : sql``
        }
      order by
        created_at desc, rowid desc
      limit ${Number(query.limit ?? 10)}
    `,
  );

  const lastItem = feedItems.at(-1);
  const nextCursor = lastItem
    ? Buffer.from(`${lastItem.rowid}@@${lastItem.createdAt}`).toString("base64")
    : null;

  response.statusCode = 200;

  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ data: feedItems, pagination: { nextCursor } }));
};
