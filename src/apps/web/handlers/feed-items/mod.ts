import type { Hono } from "hono";
import * as indexPage from "./index.js";
import * as readabilityPage from "./readability.js";
import * as showPage from "./show.js";
import * as updatePage from "./update.js";

export const handler = (router: Hono) => {
  indexPage.handler(router);
  readabilityPage.handler(router);
  showPage.handler(router);
  updatePage.handler(router);
};
