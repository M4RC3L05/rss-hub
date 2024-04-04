import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import type { CategoriesTable } from "#src/database/types/mod.ts";

export const search = (router: Hono) => {
  router.get("/", (c) => {
    const categories = c
      .get("database")
      .all<CategoriesTable & { feedCount: number }>(sql`
        select c.*, count(f.id) as feed_count
        from categories c
        left join feeds f on c.id = f.category_id
        group by c.id
        order by name collate nocase asc
      `);

    return c.json({ data: categories });
  });
};
