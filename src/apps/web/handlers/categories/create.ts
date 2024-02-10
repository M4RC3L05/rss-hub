import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";
import { categoriesViews } from "../../views/mod.js";

const requestFormSchema = z.object({ name: z.string() }).strict();

export const handler = (router: Hono) => {
  router.get("/categories/create", (c) => {
    return c.html(categoriesViews.pages.Create());
  });

  router.post(
    "/categories/create",
    zValidator("form", requestFormSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const { name } = c.req.valid("form");

      await c.get("services").api.categoriesService.create({ data: { name } });

      return c.text("ok");
    },
  );
};
