import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { makeLogger } from "#src/common/logger/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";
import { feedService } from "#src/services/mod.js";

const requestBodySchema = z
  .object({
    url: z.string().url(),
  })
  .strict();

const log = makeLogger("validate-feed-url-handler");

export const handler = (router: Hono) => {
  router.post(
    "/api/feeds/url",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      try {
        c.req.raw.signal.addEventListener("abort", () => {
          console.log("req aborted");
        });

        const data = c.req.valid("json");
        const extracted = await feedService.verifyFeed(data.url, {
          signal: c.req.raw.signal,
        });
        const title = feedService.getFeedTitle(extracted);

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
