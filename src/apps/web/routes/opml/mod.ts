import { Hono } from "@hono/hono";
import { exportFeeds } from "#src/apps/web/routes/opml/export.ts";
import { importFeeds } from "#src/apps/web/routes/opml/import.tsx";

export const opmlRoutes = () => {
  const router = new Hono();

  importFeeds(router);
  exportFeeds(router);

  return router;
};
