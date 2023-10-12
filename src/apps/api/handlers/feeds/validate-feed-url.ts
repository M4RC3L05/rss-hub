import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import createHttpError from "http-errors";
import { feedService } from "../../../../services/mod.js";

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

export const handler = async (ctx: Router.RouterContext) => {
  const body = ctx.request.body as RequestBody;

  try {
    const extracted = await feedService.verifyFeed(body.url);
    const title = feedService.getFeedTitle(extracted);

    ctx.body = { data: { title } };
  } catch (error) {
    throw createHttpError(422, { cause: error, message: "Invalid feed url" });
  }
};
