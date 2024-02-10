import sql from "@leafac/sqlite";
import type { Hono } from "hono";
import type { CategoriesTable } from "#src/database/types/mod.js";

const handler = (router: Hono) => {
  router.get("/api/categories", (c) => {
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

export default handler;
