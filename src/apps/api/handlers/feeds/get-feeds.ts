import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import { sql, type Kysely } from "kysely";
import { type DB } from "kysely-codegen";

type GetFeedsDeps = {
  db: Kysely<DB>;
};

export const schemas = {
  request: {
    query: {
      $id: "get-feeds-request-query",
      type: "object",
      properties: { categoryId: { type: "string", format: "uuid" } },
      additionalProperties: false,
    },
  },
} as const;

type RequestQuery = FromSchema<(typeof schemas)["request"]["query"]>;

export const handler = (deps: GetFeedsDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const query = ctx.query as RequestQuery;
    let q = deps.db
      .selectFrom("feeds")
      .leftJoin("feedItems", (join) =>
        join.onRef("feeds.id", "=", "feedItems.feedId").on("feedItems.readedAt", "is", null),
      )
      .selectAll("feeds")
      .select(deps.db.fn.count<number>("feedItems.id").as("unreadCount"))
      .orderBy(sql`feeds.name collate nocase`, "asc")
      .groupBy("feeds.id");

    if (query.categoryId) {
      q = q.where("feeds.categoryId", "=", query.categoryId);
    }

    const feeds = await q.execute();

    ctx.body = { data: feeds };
  };
};
