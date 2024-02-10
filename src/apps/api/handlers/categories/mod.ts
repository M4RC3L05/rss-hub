import type { Hono } from "hono";
import { default as createCategory } from "./create.js";
import { default as deleteCategory } from "./delete.js";
import { default as getCategory } from "./get.js";
import { default as getCategories } from "./search.js";
import { default as updateCategory } from "./update.js";

export const handler = (router: Hono) => {
  getCategory(router);
  getCategories(router);
  createCategory(router);
  updateCategory(router);
  deleteCategory(router);
};
