import type Router from "@koa/router";
import { type Kysely } from "kysely";
import { type DB } from "kysely-codegen";
import { type FromSchema } from "json-schema-to-ts";

type UpdateCategoryNameDeps = {
  db: Kysely<DB>;
};

export const schemas = {
  request: {
    params: {
      $id: "update-category-name-request-params",
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
      additionalProperties: false,
    },
    body: {
      $id: "update-category-name-request-body",
      type: "object",
      properties: { name: { type: "string", minLength: 2 } },
      required: ["name"],
      additionalProperties: false,
    },
  },
} as const;

type RequestParameters = FromSchema<(typeof schemas)["request"]["params"]>;
type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;

export const handler = (deps: UpdateCategoryNameDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const parameters = ctx.params as RequestParameters;
    const body = ctx.request.body as RequestBody;

    const updated = await deps.db
      .updateTable("categories")
      .set(body)
      .where("id", "=", parameters.id)
      .returningAll()
      .executeTakeFirst();

    if (!updated) {
      ctx.throw(404, "Entity not found");
    }

    ctx.body = { data: updated };
  };
};
