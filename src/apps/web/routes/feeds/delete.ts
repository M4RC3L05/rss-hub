import type { Hono } from "hono";

export const del = (router: Hono) => {
  router.post(
    "/:id/delete",
    async (c) => {
      const { id } = c.req.param();

      await c.get("services").api.feedsService.deleteFeed({
        id: id as string,
        signal: c.req.raw.signal,
      });

      return c.redirect("/");
    },
  );
};
