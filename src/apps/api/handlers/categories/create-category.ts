import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type CategoriesTable } from "../../../../database/types/mod.js";
import { RequestValidationError } from "../../../../errors/mod.js";

const requestBodySchema = z
  .object({
    name: z.string().min(2),
  })
  .strict();

export const handler = (router: Hono) => {
  router.post(
    "/api/categories",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success) throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const data = c.req.valid("json");
      const category = c.get("database").get<CategoriesTable>(sql`
        insert into categories (name)
        values (${data.name})
        returning *
      `);

      if (!category) {
        throw new HTTPException(400, { message: "Could not create category" });
      }

      return c.json({ data: category });
    },
  );
};
