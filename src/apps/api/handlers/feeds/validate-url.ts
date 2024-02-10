import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { makeLogger } from "#src/common/logger/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestBodySchema = z.object({ url: z.string().url() }).strict();

const log = makeLogger("validate-feed-url-handler");

const handler = (router: Hono) => {
  return router.post(
    "/url",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      try {
        const data = c.req.valid("json");

        const extracted = await c
          .get("feedService")
          .verifyFeed(data.url, { signal: c.req.raw.signal });

        const title = c.get("feedService").getFeedTitle(extracted);
        const feed = c
          .get("database")
          .get(sql`select id from feeds where url = ${data.url}`);

        if (feed) {
          throw new HTTPException(409, { message: "Feed url already exists" });
        }

        return c.json({ data: { title } });
      } catch (error) {
        log.error(error, "Error while checking feed url");

        throw new HTTPException(422, { message: "Invalid feed url" });
      }
    },
  );
};

export default handler;
