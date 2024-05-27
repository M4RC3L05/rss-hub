import type { Hono } from "@hono/hono";
import { FeedsCreatePage } from "#src/apps/web/views/feeds/pages/create.tsx";

export const create = (router: Hono) => {
  router.get("/create", async (c) => {
    const { data: categories } = await c.get("services").api.categoriesService
      .getCategories({ signal: c.req.raw.signal });

    return c.render(<FeedsCreatePage categories={categories} />);
  });

  router.post(
    "/create",
    async (c) => {
      const data = await c.req.parseBody();

      const { data: { title } } = await c.get("services").api.feedsService
        .verifyUrl({
          data: { url: data.url },
          signal: c.req.raw.signal,
        });

      await c.get("services").api.feedsService.createFeed({
        data: {
          ...data,
          name: typeof data.name === "string" && data.name.length > 0
            ? data.name
            : title,
        },
        signal: c.req.raw.signal,
      });

      return c.redirect("/");
    },
  );
};
