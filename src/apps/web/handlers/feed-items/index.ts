import type { Hono } from "hono";
import { feedItemsViews } from "#src/apps/web/views/mod.ts";

const replaceAndReloadLink = (url: string) =>
  `javascript:replaceAndReload("${url}")`;

export const handler = (router: Hono) => {
  router.get(
    "/feed-items",
    async (c) => {
      const { feedId, unread, bookmarked, limit, page } = c.req.query();

      const [
        { data: feed },
        { data: feedItems, pagination: feedItemsPagination },
      ] = await Promise.all([
        c.get("services").api.feedsService.getFeedById({
          id: feedId,
          signal: c.req.raw.signal,
        }),
        c.get("services").api.feedItemsService.getFeedItems({
          feedId,
          filters: { bookmarked: !!bookmarked, unread: !!unread },
          pagination: {
            limit: limit ? Number(limit) : undefined,
            page: page ? Number(page) : undefined,
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

      return c.html(
        feedItemsViews.pages.Index({
          feed,
          feedItems,
          filters: {
            unreaded: {
              state: !!unread,
              onLink: replaceAndReloadLink(
                `${currUrl.pathname}${`${
                  currUrl.search.replaceAll(
                    "&unread=true",
                    "",
                  )
                }&unread=true`}`,
              ),
              offLink: replaceAndReloadLink(
                `${currUrl.pathname}${
                  currUrl.search.replaceAll(
                    "&unread=true",
                    "",
                  )
                }`,
              ),
            },
            bookmarked: {
              state: !!bookmarked,
              onLink: replaceAndReloadLink(
                `${currUrl.pathname}${`${
                  currUrl.search.replaceAll(
                    "&bookmarked=true",
                    "",
                  )
                }&bookmarked=true`}`,
              ),
              offLink: replaceAndReloadLink(
                `${currUrl.pathname}${
                  currUrl.search.replaceAll(
                    "&bookmarked=true",
                    "",
                  )
                }`,
              ),
            },
          },
          feedItemsPagination: {
            startLink: replaceAndReloadLink(
              previousLink.replace(/&page=[0-9]+/, "&page=0"),
            ),
            previousLink: replaceAndReloadLink(previousLink),
            nextLink: replaceAndReloadLink(nextLink),
            endLink: replaceAndReloadLink(
              previousLink.replace(
                /&page=[0-9]+/,
                `&page=${
                  Math.floor(
                    feedItemsPagination.total / feedItemsPagination.limit,
                  )
                }`,
              ),
            ),
          },
        }),
      );
    },
  );
};
