import type { Hono } from "hono";
import * as exportPage from "./export.ts";
import * as importPage from "./import.ts";

export const handler = (router: Hono) => {
  exportPage.handler(router);
  importPage.handler(router);
};
