import type { Hono } from "hono";
import * as createPage from "./create.ts";
import * as deletePage from "./delete.ts";
import * as updatePage from "./update.ts";

export const handler = (router: Hono) => {
  createPage.handler(router);
  deletePage.handler(router);
  updatePage.handler(router);
};
