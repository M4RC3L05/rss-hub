import type { Hono } from "hono";

import { default as createFeed } from "./create.js";
import { default as deleteFeed } from "./delete.js";
import { default as getFeed } from "./get.js";
import { default as getFeeds } from "./search.js";
import { default as updateFeed } from "./update.js";
import { default as validateFeedUrl } from "./validate-url.js";

export type { CreateFeedRequestBodySchema } from "./create.js";
export type { UpdateFeedRequestBodySchema } from "./update.js";

export const handler = (router: Hono) => {
  getFeed(router);
  getFeeds(router);
  createFeed(router);
  validateFeedUrl(router);
  updateFeed(router);
  deleteFeed(router);
};
