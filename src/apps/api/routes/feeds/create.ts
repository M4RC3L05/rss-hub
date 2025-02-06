import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import pineSerializer from "pino-std-serializers";
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

      const [feed] = c.get("database").sql<FeedsTable>`
        insert into feeds (name, url, category_id)
        values (
          ${data.name},
          ${new URL(data.url).toString()},
          ${data.categoryId}
        )
        returning
          id, name, url,
          category_id as "categoryId",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      c.get("feedService")
        .syncFeed(feed, {
          signal: AbortSignal.any([
            c.get("shutdown"),
          ]),
        })
        .then(({ faildCount, failedReasons, successCount, totalCount }) => {
          log.info(`Synching feed ${feed.url}`, {
            failedReasons: failedReasons.map((reason) =>
              reason instanceof Error
                ? pineSerializer.errWithCause(reason)
                : reason
            ),
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
