import { type Hono } from "hono";
import * as bookmarkFeedItem from "./bookmark-feed-item.js";
import * as extractFeedItemContent from "./extract-feed-item-content.js";
import * as getFeedItem from "./get-feed-item.js";
import * as getFeedItems from "./get-feed-items.js";
import * as markFeedItemsAsRead from "./mark-feed-items-as-read.js";
import * as markFeedItemsAsUnread from "./mark-feed-items-as-unread.js";
import * as unbookmarkFeedItem from "./unbookmark-feed-item.js";

export const handler = (router: Hono) => {
  getFeedItem.handler(router);
  getFeedItems.handler(router);
  markFeedItemsAsRead.handler(router);
  markFeedItemsAsUnread.handler(router);
  bookmarkFeedItem.handler(router);
  unbookmarkFeedItem.handler(router);
  extractFeedItemContent.handler(router);
};
