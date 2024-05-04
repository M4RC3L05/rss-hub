import { Hono } from "hono";
import { index } from "#src/apps/web/routes/feed-items/index.tsx";
import { readability } from "#src/apps/web/routes/feed-items/readability.tsx";
import { show } from "#src/apps/web/routes/feed-items/show.tsx";
import { update } from "#src/apps/web/routes/feed-items/update.ts";

export const feedItemsRoutes = () => {
  const router = new Hono();

  index(router);
  readability(router);
  show(router);
  update(router);

  return router;
};
