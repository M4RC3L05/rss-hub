import { Buffer } from "node:buffer";
import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { z } from "zod";
import { type FeedItemsTable } from "../../../../database/types/mod.js";
import { RequestValidationError } from "../../../../errors/mod.js";

const requestQuerySchema = z
  .object({
    feedId: z.string().uuid(),
    unread: z.string().optional(),
    nextCursor: z.string().optional(),
    limit: z.string().optional(),
  })
  .strict();

export const handler = (router: Hono) => {
  router.get(
    "/api/feed-items",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { query: result.error } });
    }),
    (c) => {
      const query = c.req.valid("query");
      let parsedCursor: { rowId: number; createdAt: string } | undefined;

      if (query.nextCursor) {
        const [rowId, createdAt] = Buffer.from(
          decodeURIComponent(query.nextCursor),
          "base64",
        )
          .toString("utf8")
          .split("@@");
        parsedCursor = { createdAt, rowId: Number(rowId) };
      }

      const feedItems = c
        .get("database")
        .all<FeedItemsTable & { rowid: number }>(
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
        ? Buffer.from(`${lastItem.rowid}@@${lastItem.createdAt}`).toString(
            "base64",
          )
        : null;

      return c.json({ data: feedItems, pagination: { nextCursor } });
    },
  );
};
