import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import vine from "@vinejs/vine";
import { makeLogger } from "#src/common/logger/mod.ts";

const requestBodySchema = vine.object({ url: vine.string().url() });
const requestBodyValidator = vine.compile(requestBodySchema);

const log = makeLogger("validate-feed-url-handler");

export const validateUrl = (router: Hono) => {
  router.post(
    "/url",
    async (c) => {
      try {
        const data = await requestBodyValidator.validate(await c.req.json());
        const { title } = await c.get("feedService")
          .verifyFeed(data.url, {
            signal: AbortSignal.any([
              AbortSignal.timeout(10_000),
              c.get("shutdown"),
              c.req.raw.signal,
            ]),
          });

        if (!title) throw new Error("No title for feed");

        const feed = c
          .get("database")
          .get(sql`select id from feeds where url = ${data.url}`);

        if (feed) {
          throw new HTTPException(409, { message: "Feed url already exists" });
        }

        return c.json({ data: { title } });
      } catch (error) {
        log.error("Error while checking feed url", { error });

        throw new HTTPException(422, { message: "Invalid feed url" });
      }
    },
  );
};
