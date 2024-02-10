import { type Env, Hono } from "hono";
import type { SchemaType } from "#src/common/utils/types.js";
import { default as bookmarkFeedItem } from "./bookmark.js";
import { default as extractFeedItemContent } from "./extract-content.js";
import { default as getFeedItem } from "./get.js";
import { default as markFeedItemsAsRead } from "./mark-as-read.js";
import { default as markFeedItemsAsUnread } from "./mark-as-unread.js";
import { default as getFeedItems } from "./search.js";
import { default as unbookmarkFeedItem } from "./unbookmark.js";

export const router = () => {
  let router = new Hono();

  router = getFeedItem(router);
  router = getFeedItems(router);
  router = markFeedItemsAsRead(router);
  router = markFeedItemsAsUnread(router);
  router = bookmarkFeedItem(router);
  router = unbookmarkFeedItem(router);
  router = extractFeedItemContent(router);

  return router as Hono<
    Env,
    SchemaType<ReturnType<typeof getFeedItem>> &
      SchemaType<ReturnType<typeof getFeedItems>> &
      SchemaType<ReturnType<typeof markFeedItemsAsRead>> &
      SchemaType<ReturnType<typeof markFeedItemsAsUnread>> &
      SchemaType<ReturnType<typeof bookmarkFeedItem>> &
      SchemaType<ReturnType<typeof unbookmarkFeedItem>> &
      SchemaType<ReturnType<typeof extractFeedItemContent>>,
    "/"
  >;
};
