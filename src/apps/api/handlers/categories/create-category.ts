import sql from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";
import { type Middleware } from "@m4rc3l05/sss";
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

export const handler: Middleware = (request, response) => {
  const { body } = request as any as { body: RequestBody };

  const category = db.get<CategoriesTable>(sql`
    insert into categories (name)
    values (${body.name})
    returning *
  `);

  if (!category) {
    response.statusCode = 400;

    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify({ error: { code: "bad_request", message: "Could not create category" } }),
    );
  }

  response.statusCode = 201;

  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ data: category }));
};
