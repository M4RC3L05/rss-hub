import { type FromSchema } from "json-schema-to-ts";
import { type RouteMiddleware } from "@m4rc3l05/sss";
import { feedService } from "../../../../services/mod.js";
import { makeLogger } from "../../../../common/logger/mod.js";

export const schemas = {
  request: {
    body: {
      $id: "validate-feed-url-request-query",
      type: "object",
      properties: {
        url: { type: "string", format: "uri" },
      },
      required: ["url"],
      additionalProperties: false,
    },
  },
} as const;

type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;

const log = makeLogger("validate-feed-url-handler");

export const handler: RouteMiddleware = async (request, response) => {
  const { body } = request as any as { body: RequestBody };

  try {
    const extracted = await feedService.verifyFeed(body.url);
    const title = feedService.getFeedTitle(extracted);

    response.statusCode = 200;

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ data: { title } }));
  } catch (error) {
    log.error(error, "Error while checking feed url");

    response.statusCode = 200;

    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify({ error: { code: "validation_error", message: "Invalid feed url" } }),
    );
  }
};
