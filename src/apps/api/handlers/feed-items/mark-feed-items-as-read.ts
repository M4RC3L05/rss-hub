import type Router from "@koa/router";
import sql from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";
import createHttpError from "http-errors";
import { db } from "../../../../database/mod.js";

export const schemas = {
  request: {
    body: {
      $id: "mark-feed-as-read-request-body",
      oneOf: [
        {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            feedId: { type: "string", format: "uuid" },
          },
          required: ["feedId"],
          additionalProperties: false,
        },
      ],
    },
  },
} as const;

type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;

export const handler = (ctx: Router.RouterContext) => {
  const body = ctx.request.body as RequestBody;

  const result = db.run(
    sql`
      update feed_items set
        readed_at = ${new Date().toISOString()}
      where
        $${"id" in body ? sql`id = ${body.id}` : sql``}
        $${"feedId" in body ? sql`feed_id = ${body.feedId}` : sql``}
        and readed_at is null
    `,
  );

  if (result.changes <= 0) {
    throw createHttpError(400, "Could not mark feed as unread");
  }

  ctx.status = 204;
};
