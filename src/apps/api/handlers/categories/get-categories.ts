import type Router from "@koa/router";
import sql, { type Database } from "@leafac/sqlite";
import { type CategoriesTable } from "../../../../database/types/mod.js";

type GetCategoriesDeps = {
  db: Database;
};

export const handler = (deps: GetCategoriesDeps): Router.Middleware => {
  return (ctx: Router.RouterContext) => {
    const categories = deps.db.all<CategoriesTable & { feedCount: number }>(sql`
      select c.*, count(f.id) as "feedCount"
      from categories c
      left join feeds f on c.id = f.category_id
      group by c.id
      order by name collate nocase asc
    `);

    ctx.body = { data: categories };
  };
};
