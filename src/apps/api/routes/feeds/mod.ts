import { Hono } from "hono";
import { create } from "#src/apps/api/routes/feeds/create.ts";
import { del } from "#src/apps/api/routes/feeds/delete.ts";
import { get } from "#src/apps/api/routes/feeds/get.ts";
import { search } from "#src/apps/api/routes/feeds/search.ts";
import { update } from "#src/apps/api/routes/feeds/update.ts";
import { validateUrl } from "#src/apps/api/routes/feeds/validate-url.ts";

export const feedsRoutes = () => {
  const router = new Hono();

  search(router);
  get(router);
  create(router);
  validateUrl(router);
  update(router);
  del(router);

  return router;
};
