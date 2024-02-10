import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";

const requestParametersSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();
const requestBodySchema = z
  .object({
    name: z.string().min(2).optional(),
    url: z.string().url().optional(),
    categoryId: z.string().uuid().optional(),
  })
  .strict();

export type UpdateFeedRequestBodySchema = z.infer<typeof requestBodySchema>;

const handler = (router: Hono) => {
  return router.patch(
    "/:id",
    zValidator("param", requestParametersSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { params: result.error } });
    }),
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const parameters = c.req.valid("param");
      const data = c.req.valid("json");
      const feed = c.get("database").get(sql`
        update feeds set
          category_id = $${
            data.categoryId ? sql`${data.categoryId}` : sql`category_id`
          },
          name = $${data.name ? sql`${data.name}` : sql`name`},
          url = $${data.url ? sql`${data.url}` : sql`url`}
        where id = ${parameters.id}
        returning *
      `);

      if (!feed) {
        throw new HTTPException(404, { message: "Category not found" });
      }

      return c.json({ data: feed });
    },
  );
};

export default handler;
