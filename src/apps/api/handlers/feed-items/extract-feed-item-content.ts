import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { makeLogger } from "#src/common/logger/mod.js";
import { FeedItemsTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestParamsSchema = z
  .object({ id: z.string(), feedId: z.string().uuid() })
  .strict();
const log = makeLogger("extract-feed-item-contents");

export const handler = (router: Hono) => {
  router.get(
    "/api/feed-items/:feedId/:id/extract-content",
    zValidator("param", requestParamsSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const data = c.req.valid("param");
      const result = c.get("database").get<FeedItemsTable>(
        sql`
          select *
          from feed_items
          where id = ${data.id}
          and   feed_id = ${data.feedId}
        `,
      );

      if (!result || !result?.link) {
        throw new HTTPException(400, { message: "No feed link" });
      }

      try {
        const pageContent = await fetch(result?.link, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.3",
          },
        }).then((response) => response.text());

        return c.json({ data: pageContent }, 200);
      } catch (error) {
        log.error(error, "Unable to extract feed item content");

        if (!result || !result?.link) {
          throw new HTTPException(400, {
            message: "Could not extract feed item content",
          });
        }
      }
    },
  );
};
