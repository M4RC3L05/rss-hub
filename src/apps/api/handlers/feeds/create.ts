import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { stdSerializers } from "pino";
import { z } from "zod";
import { makeLogger } from "#src/common/logger/mod.js";
import type { FeedsTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestBodySchema = z
  .object({
    name: z.string().min(2),
    url: z.string().url(),
    categoryId: z.string().uuid(),
  })
  .strict();

export type CreateFeedRequestBodySchema = z.infer<typeof requestBodySchema>;

const log = makeLogger("create-feed-handler");

const handler = (router: Hono) => {
  router.post(
    "/api/feeds",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const data = c.req.valid("json");
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
          signal: c.get("shutdownManager").abortSignal,
        })
        .then(({ faildCount, failedReasons, successCount, totalCount }) => {
          log.info(
            {
              failedReasons: failedReasons.map((reason) =>
                reason instanceof Error
                  ? stdSerializers.errWithCause(reason)
                  : reason,
              ),
              faildCount,
              successCount,
              totalCount,
              feed,
            },
            `Synching feed ${feed.url}`,
          );
        })
        .catch((error) => {
          log.error(error, `Could not sync ${feed.url}`);
        });

      return c.json({ data: feed }, 201);
    },
  );
};

export default handler;
