import type { Hono } from "hono";
import { default as exportOpml } from "./export.js";
import { default as importOpml } from "./import.js";

export const handler = (router: Hono) => {
  importOpml(router);
  exportOpml(router);
};
