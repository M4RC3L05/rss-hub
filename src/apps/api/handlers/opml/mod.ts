import { Hono } from "hono";
import { default as exportOpml } from "#src/apps/api/handlers/opml/export.ts";
import { default as importOpml } from "#src/apps/api/handlers/opml/import.ts";

export const router = () => {
  let router = new Hono();

  router = importOpml(router);
  router = exportOpml(router);

  return router;
};
