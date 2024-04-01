import type { Hono } from "hono";
import { categoriesViews } from "#src/apps/web/views/mod.ts";

export const handler = (router: Hono) => {
  router.get(
    "/categories/edit",
    async (c) => {
      const { id } = c.req.query();

      const { data: category } = await c
        .get("services")
        .api.categoriesService.getCategoryById({
          id,
          signal: c.req.raw.signal,
        });

      return c.html(categoriesViews.pages.Edit({ category }));
    },
  );
  router.post(
    "/categories/edit",
    async (c) => {
      const { id, ...data } = await c.req.parseBody();

      await c
        .get("services")
        .api.categoriesService.updateCategory({
          data,
          id: id as string,
          signal: c.req.raw.signal,
        });

      return c.text("ok");
    },
  );
};
