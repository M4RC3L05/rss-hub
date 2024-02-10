import { type Env, Hono } from "hono";
import type { SchemaType } from "#src/common/utils/types.js";
import { default as createCategory } from "./create.js";
import { default as deleteCategory } from "./delete.js";
import { default as getCategory } from "./get.js";
import { default as getCategories } from "./search.js";
import { default as updateCategory } from "./update.js";

export const router = () => {
  let router = new Hono();

  router = getCategory(router);
  router = getCategories(router);
  router = createCategory(router);
  router = updateCategory(router);
  router = deleteCategory(router);

  return router as Hono<
    Env,
    SchemaType<ReturnType<typeof getCategory>> &
      SchemaType<ReturnType<typeof getCategories>> &
      SchemaType<ReturnType<typeof createCategory>> &
      SchemaType<ReturnType<typeof updateCategory>> &
      SchemaType<ReturnType<typeof deleteCategory>>,
    "/"
  >;
};
