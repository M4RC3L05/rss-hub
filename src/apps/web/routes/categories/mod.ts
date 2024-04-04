import { Hono } from "hono";
import { create } from "#src/apps/web/routes/categories/create.ts";
import { del } from "#src/apps/web/routes/categories/delete.ts";
import { update } from "#src/apps/web/routes/categories/update.ts";

export const categoriesRoutes = () => {
  const router = new Hono();

  create(router);
  del(router);
  update(router);

  return router;
};
