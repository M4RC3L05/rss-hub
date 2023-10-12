import type Router from "@koa/router";
import sql from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";
import createHttpError from "http-errors";
import { type CategoriesTable } from "../../../../database/types/mod.js";
import { db } from "../../../../database/mod.js";

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

export const handler = (ctx: Router.RouterContext) => {
  const body = ctx.request.body as RequestBody;

  const category = db.get<CategoriesTable>(sql`
    insert into categories (name)
    values (${body.name})
    returning *
  `);

  if (!category) {
    throw createHttpError(400, "Could not create category");
  }

  ctx.status = 201;
  ctx.body = { data: category };
};
