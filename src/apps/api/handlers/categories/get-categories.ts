import type Router from "@koa/router";
import sql from "@leafac/sqlite";
import { type CategoriesTable } from "../../../../database/types/mod.js";
import { db } from "../../../../database/mod.js";

export const handler = (ctx: Router.RouterContext) => {
  const categories = db.all<CategoriesTable & { feedCount: number }>(sql`
    select c.*, count(f.id) as "feedCount"
    from categories c
    left join feeds f on c.id = f.category_id
    group by c.id
    order by name collate nocase asc
  `);

  ctx.body = { data: categories };
};
