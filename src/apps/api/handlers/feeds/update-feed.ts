import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import { type Kysely } from "kysely";
import { type DB } from "kysely-codegen";

type UpdateFeedDeps = {
  db: Kysely<DB>;
};

export const schemas = {
  request: {
    params: {
      $id: "update-feed-request-params",
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
      additionalProperties: false,
    },
    body: {
      $id: "update-feed-request-body",
      type: "object",
      properties: {
        name: { type: "string", minLength: 2 },
        url: { type: "string", format: "uri" },
        categoryId: { type: "string", format: "uuid" },
      },
      additionalProperties: false,
    },
  },
} as const;

type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;
type RequestParameters = FromSchema<(typeof schemas)["request"]["params"]>;

export const handler = (deps: UpdateFeedDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const body = ctx.request.body as RequestBody;
    const parameters = ctx.params as RequestParameters;

    const feed = await deps.db
      .updateTable("feeds")
      .set(body)
      .where("id", "=", parameters.id)
      .returningAll()
      .executeTakeFirst();

    ctx.status = 200;
    ctx.body = { data: feed };
  };
};
