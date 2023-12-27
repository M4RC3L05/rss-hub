import { type Hono } from "hono";
import * as exportOpml from "./export.js";
import * as importOpml from "./import.js";

export const handler = (router: Hono) => {
  importOpml.handler(router);
  exportOpml.handler(router);
};
