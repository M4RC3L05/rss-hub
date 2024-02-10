import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";
import { categoriesViews } from "../../views/mod.js";

const requestQuerySchema = z.object({ id: z.string() }).strict();
const requestFormSchema = z
  .object({ id: z.string(), name: z.string() })
  .strict();

export const handler = (router: Hono) => {
  router.get(
    "/categories/edit",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const { id } = c.req.valid("query");

      const { data: category } = await c
        .get("services")
        .api.categoriesService.getCategoryById({ id });

      return c.html(categoriesViews.pages.Edit({ category }));
    },
  );
  router.post(
    "/categories/edit",
    zValidator("form", requestFormSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const { id, ...data } = await c.req.valid("form");

      await c
        .get("services")
        .api.categoriesService.updateCategory({ data, id });

      return c.text("ok");
    },
  );
};
