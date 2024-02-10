import type { Hono } from "hono";
import { default as bookmarkFeedItem } from "./bookmark.js";
import { default as extractFeedItemContent } from "./extract-content.js";
import { default as getFeedItem } from "./get.js";
import { default as markFeedItemsAsRead } from "./mark-as-read.js";
import { default as markFeedItemsAsUnread } from "./mark-as-unread.js";
import { default as getFeedItems } from "./search.js";
import { default as unbookmarkFeedItem } from "./unbookmark.js";

export const handler = (router: Hono) => {
  getFeedItem(router);
  getFeedItems(router);
  markFeedItemsAsRead(router);
  markFeedItemsAsUnread(router);
  bookmarkFeedItem(router);
  unbookmarkFeedItem(router);
  extractFeedItemContent(router);
};
