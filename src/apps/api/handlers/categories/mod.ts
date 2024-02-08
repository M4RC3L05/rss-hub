import { type Hono } from "hono";
import * as createCategory from "./create-category.js";
import * as deleteCatagory from "./delete-category.js";
import * as getCategories from "./get-categories.js";
import * as getCategory from "./get.category.js";
import * as updateCategory from "./update-category.js";

export const handler = (router: Hono) => {
  getCategory.handler(router);
  getCategories.handler(router);
  createCategory.handler(router);
  updateCategory.handler(router);
  deleteCatagory.handler(router);
};
