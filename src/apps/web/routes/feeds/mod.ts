import { Hono } from "hono";
import { create } from "#src/apps/web/routes/feeds/create.tsx";
import { del } from "#src/apps/web/routes/feeds/delete.ts";
import { update } from "#src/apps/web/routes/feeds/update.tsx";

export const feedsRoutes = () => {
  const router = new Hono();

  create(router);
  del(router);
  update(router);

  return router;
};
