import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import { Readability } from "@mozilla/readability";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { JSDOM } from "jsdom";
import { z } from "zod";
import { makeLogger } from "#src/common/logger/mod.js";
import type { FeedItemsTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestParamsSchema = z
  .object({ id: z.string(), feedId: z.string() })
  .strict();
const log = makeLogger("extract-feed-item-contents");

const handler = (router: Hono) => {
  return router.get(
    "/:id/:feedId/extract-content",
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
        return c.json({ data: "" }, 200);
      }

      try {
        const pageContent = await fetch(result?.link, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.3",
          },
        }).then((response) => response.text());

        const dom = new JSDOM(pageContent);

        for (const element of dom.window.document.querySelectorAll("a")) {
          element.setAttribute("target", "_blank");
        }

        const parsed = new Readability(dom.window.document).parse();

        return c.json({ data: parsed?.content ?? "" }, 200);
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

export default handler;
