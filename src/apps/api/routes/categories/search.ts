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
          count(f.id) as "feedCount"
        from categories c
        left join feeds f on c.id = f.category_id
        group by c.id
        order by name collate nocase asc
      `;

    return c.json({ data: categories });
  });
};
