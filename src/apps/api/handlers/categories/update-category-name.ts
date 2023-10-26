import { type FromSchema } from "json-schema-to-ts";
import sql from "@leafac/sqlite";
import { type RouteMiddleware } from "@m4rc3l05/sss";
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

export const handler: RouteMiddleware = (request, response) => {
  const parameters = request.params as RequestParameters;
  const { body } = request as any as { body: RequestBody };

  const updated = db.get<CategoriesTable>(sql`
    update categories set name = ${body.name}
    where id = ${parameters.id}
    returning *
  `);

  if (!updated) {
    response.statusCode = 404;

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ error: { code: "not_found", message: "Category not found" } }));
    return;
  }

  response.statusCode = 200;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ data: updated }));
};
