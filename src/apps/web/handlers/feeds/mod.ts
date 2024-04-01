import type { Hono } from "hono";
import * as createPage from "#src/apps/web/handlers/feeds/create.ts";
import * as deletePage from "#src/apps/web/handlers/feeds/delete.ts";
import * as updatePage from "#src/apps/web/handlers/feeds/update.ts";
import * as verifyUrlPage from "#src/apps/web/handlers/feeds/verify-url.ts";

export const handler = (router: Hono) => {
  createPage.handler(router);
  deletePage.handler(router);
  updatePage.handler(router);
  verifyUrlPage.handler(router);
};
