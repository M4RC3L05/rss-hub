import { Hono } from "hono";
import { default as bookmarkFeedItem } from "./bookmark.ts";
import { default as extractFeedItemContent } from "./extract-content.ts";
import { default as getFeedItem } from "./get.ts";
import { default as markFeedItemsAsRead } from "./mark-as-read.ts";
import { default as markFeedItemsAsUnread } from "./mark-as-unread.ts";
import { default as getFeedItems } from "./search.ts";
import { default as unbookmarkFeedItem } from "./unbookmark.ts";

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
