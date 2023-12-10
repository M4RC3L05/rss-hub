import { Buffer } from "node:buffer";
import sql from "@leafac/sqlite";
import { z } from "zod";
import { type Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { RequestValidationError } from "../../../../errors/mod.js";

const requestBodySchema = z.union([
  z.object({ id: z.string() }).strict(),
  z.object({ feedId: z.string().uuid(), frm: z.string() }).strict(),
]);

export const handler = (router: Hono) => {
  router.patch(
    "/api/feed-items/readed",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success) throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const data = c.req.valid("json");
      let parsedCursor: { rowId: number; createdAt: string } | undefined;

      if ("from" in data) {
        const [rowId, createdAt] = Buffer.from(data.from as string, "base64url")
          .toString("utf8")
          .split("@@");
        parsedCursor = { createdAt, rowId: Number(rowId) };
      }

      const result = c.get("database").run(
        sql`
          update feed_items set
            readed_at = ${new Date().toISOString()}
          where
            $${"id" in data ? sql`id = ${data.id}` : sql``}
            $${
              "feedId" in data
                ? sql`
                  feed_id = ${data.feedId}
                  and
                  (
                    (created_at = ${parsedCursor!.createdAt} and rowid <= ${parsedCursor!.rowId})
                    or created_at < ${parsedCursor!.createdAt}
                  )
                `
                : sql``
            }
            and readed_at is null
        `,
      );

      if (result.changes <= 0) {
        throw new HTTPException(400, { message: "Could not mark feed item as unread" });
      }

      return c.body(null, 204);
    },
  );
};
