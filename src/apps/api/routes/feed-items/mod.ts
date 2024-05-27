import { Hono } from "@hono/hono";
import { bookmark } from "#src/apps/api/routes/feed-items/bookmark.ts";
import { extractContent } from "#src/apps/api/routes/feed-items/extract-content.ts";
import { get } from "#src/apps/api/routes/feed-items/get.ts";
import { markAsRead } from "#src/apps/api/routes/feed-items/mark-as-read.ts";
import { markAsUnread } from "#src/apps/api/routes/feed-items/mark-as-unread.ts";
import { search } from "#src/apps/api/routes/feed-items/search.ts";
import { unbookmark } from "#src/apps/api/routes/feed-items/unbookmark.ts";

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
