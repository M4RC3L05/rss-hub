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
          count(
            case
              when fi.id is not null and fi.readed_at is null
                then 1 
            end
          ) as "unreadCount",
          count(
            case
              when fi.bookmarked_at is not null
                then 1 
            end
          ) as "bookmarkedCount"
        from feeds f
        left join feed_items fi on f.id = fi.feed_id
        group by f.id
        order by f.name collate nocase asc
      `;

    return c.json({ data: feeds });
  });
};
