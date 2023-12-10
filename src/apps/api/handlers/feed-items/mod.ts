import { type Hono } from "hono";
import * as getFeedItems from "./get-feed-items.js";
import * as markFeedItemsAsRead from "./mark-feed-items-as-read.js";
import * as markFeedItemsAsUnread from "./mark-feed-items-as-unread.js";

export const handler = (router: Hono) => {
  getFeedItems.handler(router);
  markFeedItemsAsRead.handler(router);
  markFeedItemsAsUnread.handler(router);
};
