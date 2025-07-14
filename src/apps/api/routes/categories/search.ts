import type { Hono } from "@hono/hono";
import type { CategoriesTable } from "#src/database/types/mod.ts";

export const search = (router: Hono) => {
  router.get("/", (c) => {
    const categories = c
      .get("database")
      .sql<CategoriesTable & { feedCount: number }>`
        select
          c.id as id,
          c.name as name,
          c.created_at as "createdAt",
          c.updated_at as "updatedAt",
          count(fi.id) as "feedsUnreadCount"
        from categories c
        left join feeds f on f.category_id = c.id
        left join feed_items fi on fi.feed_id = f.id and fi.readed_at is null
        group by c.id
        order by c.name collate nocase asc
      `;

    return c.json({ data: categories });
  });
};
