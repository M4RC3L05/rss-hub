import type Router from "@koa/router";
import sql, { type Database } from "@leafac/sqlite";
import createHttpError from "http-errors";
import { type FromSchema } from "json-schema-to-ts";

type MarkFeedItemAsUnreadDeps = {
  db: Database;
};

export const schemas = {
  request: {
    body: {
      $id: "mark-feed-as-unread-request-body",
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
} as const;

type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;

export const handler = (deps: MarkFeedItemAsUnreadDeps): Router.Middleware => {
  return (ctx: Router.RouterContext) => {
    const body = ctx.request.body as RequestBody;

    const result = deps.db.run(sql`
      update feed_items set
        readed_at = null
      where
        readed_at is not null
        $${"id" in body ? sql`and id = ${body.id}` : sql``}
    `);

    if (result.changes <= 0) throw createHttpError(400, "Could not mark feed as unread");

    ctx.status = 204;
  };
};
