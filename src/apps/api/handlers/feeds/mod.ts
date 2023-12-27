import { type Hono } from "hono";
import * as createFeed from "./create-feed.js";
import * as deleteFeed from "./delete-feed.js";
import * as getFeeds from "./get-feeds.js";
import * as updateFeed from "./update-feed.js";
import * as validateFeedUrl from "./validate-feed-url.js";

export const handler = (router: Hono) => {
  getFeeds.handler(router);
  createFeed.handler(router);
  validateFeedUrl.handler(router);
  updateFeed.handler(router);
  deleteFeed.handler(router);
};
