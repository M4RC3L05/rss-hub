import type { Hono } from "@hono/hono";
import type { FeedsTable } from "#src/database/types/mod.ts";

export const search = (router: Hono) => {
  router.get("/", (c) => {
    const feeds = c
      .get("database")
      .sql<FeedsTable & { unreadCount: number; bookmarkedCount: number }>`
        select
          f.id as id,
          f.name as name,
          f.url as url,
          f.category_id as "categoryId",
          f.created_at as "createdAt",
          f.updated_at as "updatedAt",
          coalesce(fi_bookmarked.bookmarked_count, 0) as "bookmarkedCount",
          coalesce(fi_unreaded.unread_count, 0) as "unreadCount"
        from feeds f
        left join (
          select fi.feed_id, count(*) as bookmarked_count
          from feed_items fi
          where fi.bookmarked_at is not null
          group by fi.feed_id
        ) fi_bookmarked on fi_bookmarked.feed_id = f.id
        left join (
          select fi.feed_id, count(*) as unread_count
          from feed_items fi
          where fi.readed_at is null
          group by fi.feed_id
        ) fi_unreaded on fi_unreaded.feed_id = f.id
        order by f.name collate nocase asc
      `;

    return c.json({ data: feeds });
  });
};
