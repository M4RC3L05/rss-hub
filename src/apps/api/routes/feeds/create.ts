import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import vine from "@vinejs/vine";
import { makeLogger } from "#src/common/logger/mod.ts";
import type { FeedsTable } from "#src/database/types/mod.ts";

const requestBodySchema = vine
  .object({
    name: vine.string().minLength(2),
    url: vine.string().url(),
    categoryId: vine.string().uuid(),
  });
const requestBodyValidator = vine.compile(requestBodySchema);

const log = makeLogger("create-feed-handler");

export const create = (router: Hono) => {
  router.post(
    "/",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());
      const feed = c.get("database").get<FeedsTable>(sql`
        insert into feeds (name, url, category_id)
        values (${data.name}, ${data.url}, ${data.categoryId})
        returning *
      `);

      if (!feed) {
        throw new HTTPException(400, { message: "Could not create feed" });
      }

      c.get("feedService")
        .syncFeed(feed, {
          signal: AbortSignal.any([
            AbortSignal.timeout(10_000),
            c.get("shutdown"),
            c.req.raw.signal,
          ]),
        })
        .then(({ faildCount, failedReasons, successCount, totalCount }) => {
          log.info(`Synching feed ${feed.url}`, {
            failedReasons,
            faildCount,
            successCount,
            totalCount,
            feed,
          });
        })
        .catch((error) => {
          log.error(`Could not sync ${feed.url}`, { error });
        });

      return c.json({ data: feed }, 201);
    },
  );
};
