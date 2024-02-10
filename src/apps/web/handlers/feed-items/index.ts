import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";
import { feedItemsViews } from "../../views/mod.js";

const replaceAndReloadLink = (url: string) =>
  `javascript:replaceAndReload("${url}")`;

const requestQuerySchema = z
  .object({
    feedId: z.string(),
    unread: z.string().optional(),
    bookmarked: z.string().optional(),
    limit: z.string().optional(),
    page: z.string().optional(),
  })
  .strict();

export const handler = (router: Hono) => {
  router.get(
    "/feed-items",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const { feedId, unread, bookmarked, limit, page } = c.req.valid("query");

      const [
        { data: feed },
        { data: feedItems, pagination: feedItemsPagination },
      ] = await Promise.all([
        c.get("services").api.feedsService.getFeedById({ id: feedId }),
        c.get("services").api.feedItemsService.getFeedItems({
          feedId,
          filters: { bookmarked: !!bookmarked, unread: !!unread },
          pagination: {
            limit: limit ? Number(limit) : undefined,
            page: page ? Number(page) : undefined,
          },
        }),
      ]);

      const previousLink = `/feed-items?feedId=${feedId}${
        unread ? "&unread=true" : ""
      }${bookmarked ? "&bookmarked=true" : ""}&page=${
        feedItemsPagination.previous
      }${limit ? `&limit=${limit}` : ""}`;
      const nextLink = `/feed-items?feedId=${feedId}${
        unread ? "&unread=true" : ""
      }${bookmarked ? "&bookmarked=true" : ""}&page=${
        feedItemsPagination.next
      }${limit ? `&limit=${limit}` : ""}`;

      const currUrl = new URL(c.req.url);

      return c.html(
        feedItemsViews.pages.Index({
          feed,
          feedItems,
          filters: {
            unreaded: {
              state: !!unread,
              onLink: replaceAndReloadLink(
                `${currUrl.pathname}${`${currUrl.search.replaceAll(
                  "&unread=true",
                  "",
                )}&unread=true`}`,
              ),
              offLink: replaceAndReloadLink(
                `${currUrl.pathname}${currUrl.search.replaceAll(
                  "&unread=true",
                  "",
                )}`,
              ),
            },
            bookmarked: {
              state: !!bookmarked,
              onLink: replaceAndReloadLink(
                `${currUrl.pathname}${`${currUrl.search.replaceAll(
                  "&bookmarked=true",
                  "",
                )}&bookmarked=true`}`,
              ),
              offLink: replaceAndReloadLink(
                `${currUrl.pathname}${currUrl.search.replaceAll(
                  "&bookmarked=true",
                  "",
                )}`,
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
                `&page=${Math.floor(
                  feedItemsPagination.total / feedItemsPagination.limit,
                )}`,
              ),
            ),
          },
        }),
      );
    },
  );
};
