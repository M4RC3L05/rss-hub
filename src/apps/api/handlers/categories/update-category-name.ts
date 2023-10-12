import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import sql from "@leafac/sqlite";
import { type CategoriesTable } from "../../../../database/types/mod.js";
import { db } from "../../../../database/mod.js";

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

export const handler = async (ctx: Router.RouterContext) => {
  const parameters = ctx.params as RequestParameters;
  const body = ctx.request.body as RequestBody;

  const updated = db.get<CategoriesTable>(sql`
    update categories set name = ${body.name}
    where id = ${parameters.id}
    returning *
  `);

  if (!updated) {
    ctx.throw(404, "Entity not found");
  }

  ctx.body = { data: updated };
};
