import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import createHttpError from "http-errors";
import type FeedService from "../../../../common/services/feed-service.js";

type ValidateFeedUrlDeps = {
  feedService: FeedService;
  resolveTile: (feed: Record<string, unknown>) => string | undefined;
};

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

export const handler = (deps: ValidateFeedUrlDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const body = ctx.request.body as RequestBody;

    try {
      const extracted = await deps.feedService.verifyFeed(body.url);
      const title = deps.feedService.getFeedTitle(extracted);

      ctx.body = { data: { title } };
    } catch (error) {
      throw createHttpError(422, { cause: error, message: "Invalid feed url" });
    }
  };
};
