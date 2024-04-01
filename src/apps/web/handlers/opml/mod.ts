import type { Hono } from "hono";
import * as exportPage from "#src/apps/web/handlers/opml/export.ts";
import * as importPage from "#src/apps/web/handlers/opml/import.ts";

export const handler = (router: Hono) => {
  exportPage.handler(router);
  importPage.handler(router);
};
