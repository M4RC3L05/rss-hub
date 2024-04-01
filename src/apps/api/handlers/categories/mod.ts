import { Hono } from "hono";
import { default as createCategory } from "#src/apps/api/handlers/categories/create.ts";
import { default as deleteCategory } from "#src/apps/api/handlers/categories/delete.ts";
import { default as getCategory } from "#src/apps/api/handlers/categories/get.ts";
import { default as getCategories } from "#src/apps/api/handlers/categories/search.ts";
import { default as updateCategory } from "#src/apps/api/handlers/categories/update.ts";

export const router = () => {
  let router = new Hono();

  router = getCategory(router);
  router = getCategories(router);
  router = createCategory(router);
  router = updateCategory(router);
  router = deleteCategory(router);

  return router;
};
