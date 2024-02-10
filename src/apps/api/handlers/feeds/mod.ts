import { type Env, Hono } from "hono";
import type { SchemaType } from "#src/common/utils/types.js";
import { default as createFeed } from "./create.js";
import { default as deleteFeed } from "./delete.js";
import { default as getFeed } from "./get.js";
import { default as getFeeds } from "./search.js";
import { default as updateFeed } from "./update.js";
import { default as validateFeedUrl } from "./validate-url.js";

export type { CreateFeedRequestBodySchema } from "./create.js";
export type { UpdateFeedRequestBodySchema } from "./update.js";

export const router = () => {
  let router = new Hono();

  router = getFeed(router);
  router = getFeeds(router);
  router = createFeed(router);
  router = validateFeedUrl(router);
  router = updateFeed(router);
  router = deleteFeed(router);

  return router as Hono<
    Env,
    SchemaType<ReturnType<typeof getFeed>> &
      SchemaType<ReturnType<typeof getFeeds>> &
      SchemaType<ReturnType<typeof createFeed>> &
      SchemaType<ReturnType<typeof validateFeedUrl>> &
      SchemaType<ReturnType<typeof updateFeed>> &
      SchemaType<ReturnType<typeof deleteFeed>>,
    "/"
  >;
};
