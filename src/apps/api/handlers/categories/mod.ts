import { Hono } from "hono";
import { default as createCategory } from "./create.ts";
import { default as deleteCategory } from "./delete.ts";
import { default as getCategory } from "./get.ts";
import { default as getCategories } from "./search.ts";
import { default as updateCategory } from "./update.ts";

export const router = () => {
  let router = new Hono();

  router = getCategory(router);
  router = getCategories(router);
  router = createCategory(router);
  router = updateCategory(router);
  router = deleteCategory(router);

  return router;
};
