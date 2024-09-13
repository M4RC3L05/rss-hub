import { Hono } from "@hono/hono";
import { create } from "#src/apps/web/routes/feeds/create.tsx";
import { del } from "#src/apps/web/routes/feeds/delete.ts";
import { update } from "#src/apps/web/routes/feeds/update.tsx";
import { feedLinks } from "#src/apps/web/routes/feeds/feed-links.tsx";

export const feedsRoutes = () => {
  const router = new Hono();

  feedLinks(router);
  create(router);
  del(router);
  update(router);

  return router;
};
