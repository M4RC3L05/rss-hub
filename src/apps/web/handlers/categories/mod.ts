import type { Hono } from "hono";
import * as createPage from "./create.js";
import * as deletePage from "./delete.js";
import * as updatePage from "./update.js";

export const handler = (router: Hono) => {
  createPage.handler(router);
  deletePage.handler(router);
  updatePage.handler(router);
};
