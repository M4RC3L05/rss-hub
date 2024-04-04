import { Hono } from "hono";
import { exportFeeds } from "#src/apps/api/routes/opml/export.ts";
import { importFeeds } from "#src/apps/api/routes/opml/import.ts";

export const opmlRoutes = () => {
  const router = new Hono();

  importFeeds(router);
  exportFeeds(router);

  return router;
};
