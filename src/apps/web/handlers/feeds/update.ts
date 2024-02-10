import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";
import { feedsViews } from "../../views/mod.js";

const requestQuerySchema = z.object({ id: z.string() }).strict();

const requestFormSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    url: z.string().optional(),
    categoryId: z.string().optional(),
  })
  .strict();

export const handler = (router: Hono) => {
  router.get(
    "/feeds/edit",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const { id } = c.req.valid("query");

      const [{ data: categories }, { data: feed }] = await Promise.all([
        c.get("services").api.categoriesService.getCategories(),
        c.get("services").api.feedsService.getFeedById({ id }),
      ]);

      return c.html(feedsViews.pages.Edit({ categories, feed }));
    },
  );

  router.post(
    "/feeds/edit",
    zValidator("form", requestFormSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const { id, ...data } = c.req.valid("form");

      await c.get("services").api.feedsService.editFeed({ id, data });

      return c.text("ok");
    },
  );
};
