import type { Hono } from "hono";
import { FeedsIndexPage } from "#src/apps/web/views/feeds/pages/index.tsx";

export const index = (router: Hono) => {
  router.get("/", async (c) => {
    const [{ data: categories }, { data: feeds }] = await Promise.all([
      c.get("services").api.categoriesService.getCategories({
        signal: c.req.raw.signal,
      }),
      c.get("services").api.feedsService.getFeeds({ signal: c.req.raw.signal }),
    ]);

    return c.render(<FeedsIndexPage categories={categories} feeds={feeds} />);
  });
};
