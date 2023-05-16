import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import { type Kysely } from "kysely";
import { type DB } from "kysely-codegen";

type CreateCategoryDeps = {
  db: Kysely<DB>;
};

export const schemas = {
  request: {
    body: {
      $id: "create-category-request-body",
      type: "object",
      properties: { name: { type: "string", minLength: 2 } },
      required: ["name"],
      additionalProperties: false,
    },
  },
} as const;

type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;

export const handler = (deps: CreateCategoryDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const body = ctx.request.body as RequestBody;

    const category = await deps.db
      .insertInto("categories")
      .values(body)
      .returningAll()
      .executeTakeFirst();

    ctx.status = 201;
    ctx.body = { data: category };
  };
};
