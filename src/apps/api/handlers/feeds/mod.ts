import { Hono } from "hono";
import { default as createFeed } from "#src/apps/api/handlers/feeds/create.ts";
import { default as deleteFeed } from "#src/apps/api/handlers/feeds/delete.ts";
import { default as getFeed } from "#src/apps/api/handlers/feeds/get.ts";
import { default as getFeeds } from "#src/apps/api/handlers/feeds/search.ts";
import { default as updateFeed } from "#src/apps/api/handlers/feeds/update.ts";
import { default as validateFeedUrl } from "#src/apps/api/handlers/feeds/validate-url.ts";

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
