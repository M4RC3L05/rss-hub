import sql from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";
import { type RouteMiddleware } from "@m4rc3l05/sss";
import { db } from "../../../../database/mod.js";

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

export const handler: RouteMiddleware = (request, response) => {
  const { body } = request as any as { body: RequestBody };
  const parameters = request.params as RequestParameters;

  const feed = db.get(sql`
    update feeds set
      category_id = $${body.categoryId ? sql`${body.categoryId}` : sql`category_id`},
      name = $${body.name ? sql`${body.name}` : sql`name`},
      url = $${body.url ? sql`${body.url}` : sql`url`}
    where id = ${parameters.id}
    returning *
  `);

  if (!feed) {
    response.statusCode = 404;

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ error: { code: "not_found", message: "Category not found" } }));
    return;
  }

  response.statusCode = 200;

  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ data: feed }));
};
