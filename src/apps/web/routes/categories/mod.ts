import { Hono } from "@hono/hono";
import { create } from "#src/apps/web/routes/categories/create.tsx";
import { del } from "#src/apps/web/routes/categories/delete.ts";
import { update } from "#src/apps/web/routes/categories/update.tsx";

export const categoriesRoutes = () => {
  const router = new Hono();

  create(router);
  del(router);
  update(router);

  return router;
};
