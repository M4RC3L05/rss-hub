import { type Hono } from "hono";
import * as createCategory from "./create-category.js";
import * as getCategories from "./get-categories.js";
import * as updateCategoryName from "./update-category-name.js";
import * as deleteCatagory from "./delete-category.js";

export const handler = (router: Hono) => {
  getCategories.handler(router);
  createCategory.handler(router);
  updateCategoryName.handler(router);
  deleteCatagory.handler(router);
};
