import { type RouteMiddleware } from "@m4rc3l05/sss";
import sql from "@leafac/sqlite";
import { type CategoriesTable } from "../../../../database/types/mod.js";
import { db } from "../../../../database/mod.js";

export const handler: RouteMiddleware = (_, response) => {
  const categories = db.all<CategoriesTable & { feedCount: number }>(sql`
    select c.*, count(f.id) as "feedCount"
    from categories c
    left join feeds f on c.id = f.category_id
    group by c.id
    order by name collate nocase asc
  `);

  response.statusCode = 200;

  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ data: categories }));
};
