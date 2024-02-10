import { type Env, Hono } from "hono";
import type { SchemaType } from "#src/common/utils/types.js";
import { default as exportOpml } from "./export.js";
import { default as importOpml } from "./import.js";

export const router = () => {
  let router = new Hono();

  router = importOpml(router);
  router = exportOpml(router);

  return router as Hono<
    Env,
    SchemaType<ReturnType<typeof importOpml>> &
      SchemaType<ReturnType<typeof exportOpml>>,
    "/"
  >;
};
