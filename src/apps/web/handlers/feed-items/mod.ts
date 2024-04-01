import type { Hono } from "hono";
import * as indexPage from "#src/apps/web/handlers/feed-items/index.ts";
import * as readabilityPage from "#src/apps/web/handlers/feed-items/readability.ts";
import * as showPage from "#src/apps/web/handlers/feed-items/show.ts";
import * as updatePage from "#src/apps/web/handlers/feed-items/update.ts";

export const handler = (router: Hono) => {
  indexPage.handler(router);
  readabilityPage.handler(router);
  showPage.handler(router);
  updatePage.handler(router);
};
