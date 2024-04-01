import type { Hono } from "hono";
import * as indexPage from "./index.ts";

export const handler = (router: Hono) => {
  indexPage.handler(router);
};
