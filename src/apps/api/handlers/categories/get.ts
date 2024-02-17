import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { CategoriesTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestParametersSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

const handler = (router: Hono) => {
  return router.get(
    "/:id",
    zValidator("param", requestParametersSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const { id } = c.req.valid("param");
      const category = c.get("database").get<CategoriesTable>(sql`
        select *
        from categories
        where id = ${id}
      `);

      if (!category) {
        throw new HTTPException(404, { message: "Could not find category" });
      }

      return c.json({ data: category });
    },
  );
};

export default handler;
