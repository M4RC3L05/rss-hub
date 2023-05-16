import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import { type Kysely } from "kysely";
import { type DB } from "kysely-codegen";

type CreateFeedDeps = {
  db: Kysely<DB>;
};

export const schemas = {
  request: {
    params: {
      $id: "delete-feed-request-params",
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
} as const;

type RequestParameters = FromSchema<(typeof schemas)["request"]["params"]>;

export const handler = (deps: CreateFeedDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const parameters = ctx.params as RequestParameters;

    const deleted = await deps.db
      .deleteFrom("feeds")
      .where("id", "=", parameters.id)
      .returningAll()
      .executeTakeFirst();

    if (!deleted) {
      ctx.throw(404, "Entity not found");
    }

    ctx.status = 204;
  };
};
