import type { Hono } from "hono";
import * as exportPage from "./export.js";
import * as importPage from "./import.js";

export const handler = (router: Hono) => {
  exportPage.handler(router);
  importPage.handler(router);
};
