import { Hono } from "hono";
import { default as exportOpml } from "./export.ts";
import { default as importOpml } from "./import.ts";

export const router = () => {
  let router = new Hono();

  router = importOpml(router);
  router = exportOpml(router);

  return router;
};
