import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import sql from "@leafac/sqlite";
import createHttpError from "http-errors";
import { stdSerializers } from "pino";
import { type FeedsTable } from "../../../../database/types/mod.js";
import { makeLogger } from "../../../../common/logger/mod.js";
import { db } from "../../../../database/mod.js";
import { feedService } from "../../../../services/mod.js";

export const schemas = {
  request: {
    body: {
      $id: "create-feed-request-body",
      type: "object",
      properties: {
        name: { type: "string", minLength: 2 },
        url: { type: "string", format: "uri" },
        categoryId: { type: "string", format: "uuid" },
      },
      required: ["name", "url", "categoryId"],
      additionalProperties: false,
    },
  },
} as const;

type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;

const log = makeLogger("create-feed-handler");

export const handler = async (ctx: Router.RouterContext) => {
  const body = ctx.request.body as RequestBody;

  const feed = db.get<FeedsTable>(sql`
    insert into feeds (name, url, category_id)
    values (${body.name}, ${body.url}, ${body.categoryId})
    returning *
  `);

  if (!feed) throw createHttpError(400, "Could not create feed");

  feedService
    .syncFeed(feed)
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

  ctx.status = 201;
  ctx.body = { data: feed };
};
