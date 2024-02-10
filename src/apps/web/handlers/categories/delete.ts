import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";

const requestFormSchema = z.object({ id: z.string() }).strict();

export const handler = (router: Hono) => {
  router.post(
    "/categories/delete",
    zValidator("form", requestFormSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const { id } = c.req.valid("form");

      await c.get("services").api.categoriesService.deleteCategory({ id });

      return c.text("ok");
    },
  );
};
