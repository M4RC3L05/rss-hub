import { Hono } from "hono";
import { default as bookmarkFeedItem } from "#src/apps/api/handlers/feed-items/bookmark.ts";
import { default as extractFeedItemContent } from "#src/apps/api/handlers/feed-items/extract-content.ts";
import { default as getFeedItem } from "#src/apps/api/handlers/feed-items/get.ts";
import { default as markFeedItemsAsRead } from "#src/apps/api/handlers/feed-items/mark-as-read.ts";
import { default as markFeedItemsAsUnread } from "#src/apps/api/handlers/feed-items/mark-as-unread.ts";
import { default as getFeedItems } from "#src/apps/api/handlers/feed-items/search.ts";
import { default as unbookmarkFeedItem } from "#src/apps/api/handlers/feed-items/unbookmark.ts";

export const router = () => {
  let router = new Hono();

  router = getFeedItem(router);
  router = getFeedItems(router);
  router = markFeedItemsAsRead(router);
  router = markFeedItemsAsUnread(router);
  router = bookmarkFeedItem(router);
  router = unbookmarkFeedItem(router);
  router = extractFeedItemContent(router);

  return router;
};
