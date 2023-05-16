import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import { type Kysely } from "kysely";
import { type DB } from "kysely-codegen";

type GetFeedItemsDeps = {
  db: Kysely<DB>;
};

export const schemas = {
  request: {
    query: {
      $id: "get-feed-items-request-query",
      type: "object",
      properties: { feedId: { type: "string", format: "uuid" }, unread: { type: "string" } },
      additionalProperties: false,
    },
  },
} as const;

type RequestQuery = FromSchema<(typeof schemas)["request"]["query"]>;

export const handler = (deps: GetFeedItemsDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const query = ctx.query as RequestQuery;
    let q = deps.db.selectFrom("feedItems").selectAll().orderBy("createdAt", "desc");

    if (query.feedId) {
      q = q.where("feedId", "=", query.feedId);
    }

    if (query.unread) {
      q = q.where("readedAt", "is", null);
    }

    const feedItems = await q.execute();

    ctx.body = { data: feedItems };
  };
};
