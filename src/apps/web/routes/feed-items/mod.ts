import { Hono } from "hono";
import { index } from "#src/apps/web/routes/feed-items/index.ts";
import { readability } from "#src/apps/web/routes/feed-items/readability.ts";
import { show } from "#src/apps/web/routes/feed-items/show.ts";
import { update } from "#src/apps/web/routes/feed-items/update.ts";

export const feedItemsRoutes = () => {
  const router = new Hono();

  index(router);
  readability(router);
  show(router);
  update(router);

  return router;
};
