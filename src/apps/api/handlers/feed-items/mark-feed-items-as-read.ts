import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import { type Kysely } from "kysely";
import { type DB } from "kysely-codegen";

type MarkFeedItemAsReadDeps = {
  db: Kysely<DB>;
};

export const schemas = {
  request: {
    body: {
      $id: "mark-feed-as-read-request-body",
      anyOf: [
        {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            feedId: { type: "string", format: "uuid" },
          },
          required: ["feedId"],
          additionalProperties: false,
        },
      ],
    },
  },
} as const;

type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;

export const handler = (deps: MarkFeedItemAsReadDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const body = ctx.request.body as RequestBody;

    let q = deps.db
      .updateTable("feedItems")
      .set({ readedAt: new Date().toISOString() })
      .where("readedAt", "is", null);

    if ("id" in body) {
      q = q.where("id", "=", (body as { id: string }).id);
    }

    if ("feedId" in body) {
      q = q.where("feedId", "=", (body as { feedId: string }).feedId);
    }

    await q.execute();

    ctx.status = 204;
  };
};
