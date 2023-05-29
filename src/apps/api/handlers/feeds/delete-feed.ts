import type Router from "@koa/router";
import sql, { type Database } from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";

type CreateFeedDeps = {
  db: Database;
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

    const deleted = deps.db.get(sql`
      delete from feeds
      where id = ${parameters.id}
      returning *
    `);

    if (!deleted) {
      ctx.throw(404, "Entity not found");
    }

    ctx.status = 204;
  };
};
