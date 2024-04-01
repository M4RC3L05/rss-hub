import type { Hono } from "hono";
import * as createPage from "#src/apps/web/handlers/categories/create.ts";
import * as deletePage from "#src/apps/web/handlers/categories/delete.ts";
import * as updatePage from "#src/apps/web/handlers/categories/update.ts";

export const handler = (router: Hono) => {
  createPage.handler(router);
  deletePage.handler(router);
  updatePage.handler(router);
};
