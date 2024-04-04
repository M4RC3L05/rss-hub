import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import type { FeedsTable } from "#src/database/types/mod.ts";

export const search = (router: Hono) => {
  router.get("/", (c) => {
    const feeds = c
      .get("database")
      .all<FeedsTable & { unreadCount: number; bookmarkedCount: number }>(sql`
        select
          f.*,
          count(case when fi.readed_at is null then 1 end) as unread_count,
          count(case when fi.bookmarked_at is not null then 1 end) as bookmarked_count
        from feeds f
        left join feed_items fi on f.id = fi.feed_id
        group by f.id
        order by f.name collate nocase asc
      `);

    return c.json({ data: feeds });
  });
};
