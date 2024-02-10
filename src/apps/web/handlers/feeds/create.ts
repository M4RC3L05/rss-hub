import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";
import { feedsViews } from "../../views/mod.js";

const requestFormSchema = z
  .object({ name: z.string(), url: z.string(), categoryId: z.string() })
  .strict();

export const handler = (router: Hono) => {
  router.get("/feeds/create", async (c) => {
    const { data: categories } = await c
      .get("services")
      .api.categoriesService.getCategories();

    return c.html(feedsViews.pages.Create({ categories }));
  });

  router.post(
    "/feeds/create",
    zValidator("form", requestFormSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const data = c.req.valid("form");

      await c.get("services").api.feedsService.createFeed({ data });

      return c.text("ok");
    },
  );
};
