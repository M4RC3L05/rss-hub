import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import sql, { type Database } from "@leafac/sqlite";
import createHttpError from "http-errors";
import { type FeedsTable } from "../../../../database/types/mod.js";
import type makeLogger from "../../../../common/logger/mod.js";
import type FeedService from "../../../../common/services/feed-service.js";

type CreateFeedDeps = {
  db: Database;
  logger: typeof makeLogger;
  feedService: FeedService;
};

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

export const handler = (deps: CreateFeedDeps): Router.Middleware => {
  const log = deps.logger("create-feed-handler");

  return async (ctx: Router.RouterContext) => {
    const body = ctx.request.body as RequestBody;

    const feed = deps.db.get<FeedsTable>(sql`
      insert into feeds (name, url, category_id)
      values (${body.name}, ${body.url}, ${body.categoryId})
      returning *
    `);

    if (!feed) throw createHttpError(400, "Could not create feed");

    deps.feedService
      .syncFeed(feed)
      .then((result) => {
        log.info(result, `Synching feed ${feed.url}`);
      })
      .catch((error) => {
        log.error(error, `Could not sync ${feed.url}`);
      });

    ctx.status = 201;
    ctx.body = { data: feed };
  };
};
