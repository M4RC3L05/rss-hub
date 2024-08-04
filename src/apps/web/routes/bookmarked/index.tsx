import type { Hono } from "@hono/hono";
import { BookmarkedFeedItemsPage } from "#src/apps/web/views/bookmarked/pages/index.tsx";

export const index = (router: Hono) => {
  router.get("/", async (c) => {
    const { limit, page } = c.req.query();
    const { data: feedItems, pagination: feedItemsPagination } = await c.get(
      "services",
    ).api.feedItemsService.getFeedItems(
      {
        signal: c.req.raw.signal,
        filters: { bookmarked: true },
        pagination: {
          limit: limit ? Number(limit) : undefined,
          page: page ? Number(page) : undefined,
        },
      },
    );

    const previousLink = `/bookmarked?page=${feedItemsPagination.previous}${
      limit ? `&limit=${limit}` : ""
    }`;
    const nextLink = `/bookmarked?page=${feedItemsPagination.next}${
      limit ? `&limit=${limit}` : ""
    }`;

    return c.render(
      <BookmarkedFeedItemsPage
        feedItems={feedItems}
        feedItemsPagination={{
          startLink: previousLink.replace(/\?page=[0-9]+/, "?page=0"),
          previousLink: previousLink,
          nextLink: nextLink,
          endLink: nextLink.replace(
            /\?page=[0-9]+/,
            `?page=${
              Math.floor(
                feedItemsPagination.total / feedItemsPagination.limit,
              )
            }`,
          ),
        }}
      />,
    );
  });
};
