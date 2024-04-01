import type { Hono } from "hono";
import * as indexPage from "./index.ts";
import * as readabilityPage from "./readability.ts";
import * as showPage from "./show.ts";
import * as updatePage from "./update.ts";

export const handler = (router: Hono) => {
  indexPage.handler(router);
  readabilityPage.handler(router);
  showPage.handler(router);
  updatePage.handler(router);
};
