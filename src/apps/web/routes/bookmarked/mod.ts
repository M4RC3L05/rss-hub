import { Hono } from "@hono/hono";
import { index } from "#src/apps/web/routes/bookmarked/index.tsx";

export const bookmarkedRoutes = () => {
  const router = new Hono();

  index(router);

  return router;
};
