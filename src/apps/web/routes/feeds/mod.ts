import { Hono } from "hono";
import { create } from "#src/apps/web/routes/feeds/create.ts";
import { del } from "#src/apps/web/routes/feeds/delete.ts";
import { update } from "#src/apps/web/routes/feeds/update.ts";

export const feedsRoutes = () => {
  const router = new Hono();

  create(router);
  del(router);
  update(router);

  return router;
};
