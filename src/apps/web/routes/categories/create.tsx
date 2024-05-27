import type { Hono } from "@hono/hono";
import { CategoriesCreatePage } from "#src/apps/web/views/categories/pages/create.tsx";

export const create = (router: Hono) => {
  router.get("/create", (c) => {
    return c.render(<CategoriesCreatePage />);
  });

  router.post(
    "/create",
    async (c) => {
      await c.get("services").api.categoriesService.createCategory({
        data: await c.req.parseBody(),
        signal: c.req.raw.signal,
      });

      return c.redirect("/");
    },
  );
};
