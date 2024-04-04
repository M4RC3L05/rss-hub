import { Hono } from "hono";
import { create } from "#src/apps/api/routes/categories/create.ts";
import { del } from "#src/apps/api/routes/categories/delete.ts";
import { get } from "#src/apps/api/routes/categories/get.ts";
import { search } from "#src/apps/api/routes/categories/search.ts";
import { update } from "#src/apps/api/routes/categories/update.ts";

export const categoriesRoutes = () => {
  const router = new Hono();

  get(router);
  search(router);
  create(router);
  update(router);
  del(router);

  return router;
};
