import type Router from "@koa/router";
import { type FromSchema } from "json-schema-to-ts";
import type FeedService from "../../../../common/services/feed-service.js";

type ValidateFeedUrlDeps = {
  feedService: FeedService;
  resolveTile: (feed: Record<string, unknown>) => string | undefined;
};

export const schemas = {
  request: {
    query: {
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

type RequestQuery = FromSchema<(typeof schemas)["request"]["query"]>;

export const handler = (deps: ValidateFeedUrlDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const query = ctx.request.query as RequestQuery;

    try {
      const extracted = await deps.feedService.verifyFeed(query.url);
      const title = deps.feedService.getFeedTitle(extracted);

      ctx.body = { data: { title } };
    } catch {
      ctx.throw(422, "Invalid feed url");
    }
  };
};
