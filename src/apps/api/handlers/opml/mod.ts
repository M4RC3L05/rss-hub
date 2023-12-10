import { type Hono } from "hono";
import * as importOpml from "./import.js";
import * as exportOpml from "./export.js";

export const handler = (router: Hono) => {
  importOpml.handler(router);
  exportOpml.handler(router);
};
