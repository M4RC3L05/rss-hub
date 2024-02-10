import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { CategoriesTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestParametersSchema = z.object({ id: z.string().uuid() }).strict();
const requestBodySchema = z.object({ name: z.string().min(2) }).strict();

const handler = (router: Hono) => {
  router.patch(
    "/api/categories/:id",
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
      const body = c.req.valid("json");
      const updated = c.get("database").get<CategoriesTable>(sql`
        update categories set name = ${body.name}
        where id = ${parameters.id}
        returning *
      `);

      if (!updated) {
        throw new HTTPException(404, { message: "Category not found" });
      }

      return c.json({ data: updated });
    },
  );
};

export default handler;
