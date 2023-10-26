import { Buffer } from "node:buffer";
import sql from "@leafac/sqlite";
import { type FromSchema } from "json-schema-to-ts";
import { type RouteMiddleware } from "@m4rc3l05/sss";
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
            from: { type: "string" },
          },
          required: ["feedId", "from"],
          additionalProperties: false,
        },
      ],
    },
  },
} as const;

type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;

export const handler: RouteMiddleware = (request, response) => {
  const { body } = request as any as { body: RequestBody };
  let parsedCursor: { rowId: number; createdAt: string } | undefined;

  if ("from" in body) {
    const [rowId, createdAt] = Buffer.from(body.from, "base64url").toString("utf8").split("@@");
    parsedCursor = { createdAt, rowId: Number(rowId) };
  }

  const result = db.run(
    sql`
      update feed_items set
        readed_at = ${new Date().toISOString()}
      where
        $${"id" in body ? sql`id = ${body.id}` : sql``}
        $${
          "feedId" in body
            ? sql`
              feed_id = ${body.feedId}
              and
              (
                (created_at = ${parsedCursor!.createdAt} and rowid <= ${parsedCursor!.rowId})
                or created_at < ${parsedCursor!.createdAt}
              )
            `
            : sql``
        }
        and readed_at is null
    `,
  );

  if (result.changes <= 0) {
    response.statusCode = 400;

    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify({ error: { code: "bad_request", message: "Could not mark feed as unread" } }),
    );

    return;
  }

  response.statusCode = 204;

  response.end();
};
