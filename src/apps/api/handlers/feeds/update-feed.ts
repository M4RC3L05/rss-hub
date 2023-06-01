import type Router from "@koa/router";
import sql, { type Database } from "@leafac/sqlite";
import createHttpError from "http-errors";
import { type FromSchema } from "json-schema-to-ts";

type UpdateFeedDeps = {
  db: Database;
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
  return (ctx: Router.RouterContext) => {
    const body = ctx.request.body as RequestBody;
    const parameters = ctx.params as RequestParameters;

    const feed = deps.db.get(sql`
      update feeds set
        category_id = $${body.categoryId ? sql`${body.categoryId}` : sql`category_id`},
        name = $${body.name ? sql`${body.name}` : sql`name`},
        url = $${body.url ? sql`${body.url}` : sql`url`}
      where id = ${parameters.id}
      returning *
    `);

    if (!feed) throw createHttpError(404, "Feed not found");

    ctx.status = 200;
    ctx.body = { data: feed };
  };
};
