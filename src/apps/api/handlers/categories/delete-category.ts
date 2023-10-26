import sql from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";
import { type RouteMiddleware } from "@m4rc3l05/sss";
import { db } from "../../../../database/mod.js";
import { makeLogger } from "../../../../common/logger/mod.js";

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

const log = makeLogger("delete-category-handler");

export const handler: RouteMiddleware = (request, response) => {
  const parameters = request.params as RequestParameters;

  const { changes } = db.run(sql`
    delete from categories
    where id = ${parameters.id}
    returning *
  `);

  if (changes === 0) {
    log.warn({ categoryId: parameters.id }, "No category was deleted");
  }

  response.statusCode = 204;
  response.end();
};
