import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import { type Kysely } from "kysely";
import { type DB } from "kysely-codegen";

type MarkFeedItemAsUnreadDeps = {
  db: Kysely<DB>;
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
  return async (ctx: Router.RouterContext) => {
    const body = ctx.request.body as RequestBody;

    let q = deps.db
      .updateTable("feedItems")
      .set({ readedAt: null })
      .where("readedAt", "is not", null);

    if ("id" in body) {
      q = q.where("id", "=", (body as { id: string }).id);
    }

    await q.execute();

    ctx.status = 204;
  };
};
