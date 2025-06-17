import type { Hono } from "@hono/hono";
import { FeedLinksPage } from "#src/apps/web/views/feeds/pages/feed-links.tsx";

export const feedLinks = (router: Hono) => {
  router.get(
    "/feed-links",
    async (c) => {
      const url = c.req.query("url");
      let links: string[] | undefined = undefined;

      if (url) {
        const { data } = await c.get("services").api.feedsService.getFeedLinks({
          url,
          signal: c.req.raw.signal,
        });
        links = data;
      }

      return c.render(<FeedLinksPage url={url ?? ""} links={links ?? []} />);
    },
  );
};
