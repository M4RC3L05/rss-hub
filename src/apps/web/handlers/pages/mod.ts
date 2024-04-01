import type { Hono } from "hono";
import * as indexPage from "#src/apps/web/handlers/pages/index.ts";

export const handler = (router: Hono) => {
  indexPage.handler(router);
};
