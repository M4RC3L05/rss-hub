import { Hono } from "hono";
import { default as createFeed } from "./create.ts";
import { default as deleteFeed } from "./delete.ts";
import { default as getFeed } from "./get.ts";
import { default as getFeeds } from "./search.ts";
import { default as updateFeed } from "./update.ts";
import { default as validateFeedUrl } from "./validate-url.ts";

export const router = () => {
  let router = new Hono();

  router = getFeed(router);
  router = getFeeds(router);
  router = createFeed(router);
  router = validateFeedUrl(router);
  router = updateFeed(router);
  router = deleteFeed(router);

  return router;
};
