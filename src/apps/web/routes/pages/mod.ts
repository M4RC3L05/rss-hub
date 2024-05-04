import { Hono } from "hono";
import { index } from "#src/apps/web/routes/pages/index.tsx";

export const pagesRoutes = () => {
  const router = new Hono();

  index(router);

  return router;
};
