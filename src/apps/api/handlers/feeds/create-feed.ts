import sql from "@leafac/sqlite";
import { stdSerializers } from "pino";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type FeedsTable } from "../../../../database/types/mod.js";
import { makeLogger } from "../../../../common/logger/mod.js";
import { feedService } from "../../../../services/mod.js";
import { RequestValidationError } from "../../../../errors/mod.js";

const requestBodySchema = z
  .object({
    name: z.string().min(2),
    url: z.string().url(),
    categoryId: z.string().uuid(),
  })
  .strict();

const log = makeLogger("create-feed-handler");

export const handler = (router: Hono) => {
  router.post(
    "/api/feeds",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success) throw new RequestValidationError({ request: { body: result.error } });
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

      feedService
        .syncFeed(feed, { database: c.get("database"), signal: c.req.raw.signal })
        .then(({ faildCount, failedReasons, successCount, totalCount }) => {
          log.info(
            {
              failedReasons: failedReasons.map((reason) =>
                reason instanceof Error ? stdSerializers.errWithCause(reason) : reason,
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
