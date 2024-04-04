import type { Hono } from "hono";
import { categoriesViews } from "#src/apps/web/views/mod.ts";

export const handler = (router: Hono) => {
  router.get("/categories/create", (c) => {
    return c.html(categoriesViews.pages.Create());
  });

  router.post(
    "/categories/create",
    async (c) => {
      await c.get("services").api.categoriesService.createCategory({
        data: await c.req.parseBody(),
        signal: c.req.raw.signal,
      });

      return c.redirect("/");
    },
  );
};
