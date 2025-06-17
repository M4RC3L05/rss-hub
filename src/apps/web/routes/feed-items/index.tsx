import type { Hono } from "@hono/hono";
import { FeedItemsIndexPage } from "#src/apps/web/views/feed-items/pages/index.tsx";

export const index = (router: Hono) => {
  router.get(
    "/",
    async (c) => {
      const { feedId, unread, bookmarked, limit, page } = c.req.query();

      const [
        { data: feed },
        { data: feedItems, pagination: feedItemsPagination },
      ] = await Promise.all([
        c.get("services").api.feedsService.getFeedById({
          id: feedId!,
          signal: c.req.raw.signal,
        }),
        c.get("services").api.feedItemsService.getFeedItems({
          feedId: feedId!,
          filters: { bookmarked: !!bookmarked, unread: !!unread },
          pagination: {
            limit: limit ? Number(limit) : 10,
            page: page ? Number(page) : 0,
          },
          signal: c.req.raw.signal,
        }),
      ]);

      const previousLink = `/feed-items?feedId=${feedId}${
        unread ? "&unread=true" : ""
      }${
        bookmarked ? "&bookmarked=true" : ""
      }&page=${feedItemsPagination.previous}${limit ? `&limit=${limit}` : ""}`;
      const nextLink = `/feed-items?feedId=${feedId}${
        unread ? "&unread=true" : ""
      }${
        bookmarked ? "&bookmarked=true" : ""
      }&page=${feedItemsPagination.next}${limit ? `&limit=${limit}` : ""}`;

      const currUrl = new URL(c.req.url);

      return c.render(
        <FeedItemsIndexPage
          feed={feed}
          feedItems={feedItems}
          filters={{
            unreaded: {
              state: !!unread,
              onLink: `${currUrl.pathname}${`${
                currUrl.search.replaceAll(
                  "&unread=true",
                  "",
                )
              }&unread=true`}`,
              offLink: `${currUrl.pathname}${
                currUrl.search.replaceAll(
                  "&unread=true",
                  "",
                )
              }`,
            },
            bookmarked: {
              state: !!bookmarked,
              onLink: `${currUrl.pathname}${`${
                currUrl.search.replaceAll(
                  "&bookmarked=true",
                  "",
                )
              }&bookmarked=true`}`,
              offLink: `${currUrl.pathname}${
                currUrl.search.replaceAll(
                  "&bookmarked=true",
                  "",
                )
              }`,
            },
          }}
          feedItemsPagination={{
            startLink: previousLink.replace(/&page=[0-9]+/, "&page=0"),
            previousLink: previousLink,
            nextLink: nextLink,
            endLink: previousLink.replace(
              /&page=[0-9]+/,
              `&page=${
                Math.floor(
                  feedItemsPagination.total / feedItemsPagination.limit,
                )
              }`,
            ),
          }}
        />,
      );
    },
  );
};
