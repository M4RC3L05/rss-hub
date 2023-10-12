import type Router from "@koa/router";
import sql from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";
import { type CategoriesTable } from "../../../../database/types/mod.js";
import { db } from "../../../../database/mod.js";

export const schemas = {
  request: {
    params: {
      $id: "delete-category-request-params",
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
} as const;

type RequestParameters = FromSchema<(typeof schemas)["request"]["params"]>;

export const handler = (ctx: Router.RouterContext) => {
  const parameters = ctx.params as RequestParameters;

  const deleted = db.get<CategoriesTable>(sql`
    delete from categories
    where id = ${parameters.id}
    returning *
  `);

  if (!deleted) {
    ctx.throw(404, "Entity not found");
  }

  ctx.status = 204;
};
