import { Hono } from "hono";
import { bookmark } from "./bookmark.ts";
import { extractContent } from "./extract-content.ts";
import { get } from "./get.ts";
import { markAsRead } from "./mark-as-read.ts";
import { markAsUnread } from "./mark-as-unread.ts";
import { search } from "./search.ts";
import { unbookmark } from "./unbookmark.ts";

export const feedItemsRoutes = () => {
  const router = new Hono();

  get(router);
  search(router);
  markAsRead(router);
  markAsUnread(router);
  bookmark(router);
  unbookmark(router);
  extractContent(router);

  return router;
};
