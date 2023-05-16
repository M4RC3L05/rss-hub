import type Router from "@koa/router";
import { sql, type Kysely } from "kysely";
import { type DB } from "kysely-codegen";

type GetCategoriesDeps = {
  db: Kysely<DB>;
};

export const handler = (deps: GetCategoriesDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    const categories = await deps.db
      .selectFrom("categories")
      .leftJoin("feeds", "categories.id", "feeds.categoryId")
      .selectAll("categories")
      .select(deps.db.fn.count<number>("feeds.id").as("feedCount"))
      .orderBy(sql`name collate nocase`, "asc")
      .groupBy("categories.id")
      .execute();

    ctx.body = { data: categories };
  };
};
