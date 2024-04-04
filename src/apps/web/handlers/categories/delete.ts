import type { Hono } from "hono";

export const handler = (router: Hono) => {
  router.post(
    "/categories/:id/delete",
    async (c) => {
      const { id } = c.req.param();
      await c.get("services").api.categoriesService.deleteCategory({
        id: id as string,
        signal: c.req.raw.signal,
      });

      return c.redirect("/");
    },
  );
};
