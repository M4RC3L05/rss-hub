import { Hono } from "hono";
import { exportFeeds } from "#src/apps/web/routes/opml/export.ts";
import { importFeeds } from "#src/apps/web/routes/opml/import.ts";

export const opmlRoutes = () => {
  const router = new Hono();

  importFeeds(router);
  exportFeeds(router);

  return router;
};
