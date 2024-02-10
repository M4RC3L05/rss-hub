import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { CategoriesTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestBodySchema = z
  .object({
    name: z.string().min(2),
  })
  .strict();

const handler = (router: Hono) => {
  return router.post(
    "/",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
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

export default handler;
