import type { Hono } from "hono";

export const handler = (router: Hono) => {
  router.post(
    "/categories/delete",
    async (c) => {
      const { id } = await c.req.parseBody();
      await c.get("services").api.categoriesService.deleteCategory({
        id: id as string,
        signal: c.req.raw.signal,
      });

      return c.text("ok");
    },
  );
};
