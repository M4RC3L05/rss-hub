import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import vine from "@vinejs/vine";
import type { CategoriesTable } from "#src/database/types/mod.ts";

const requestParametersSchema = vine.object({ id: vine.string().uuid() });
const requestParametersValidator = vine.compile(requestParametersSchema);

const requestBodySchema = vine.object({ name: vine.string().minLength(2) });
const requestBodyValidator = vine.compile(requestBodySchema);

export const update = (router: Hono) => {
  router.patch(
    "/:id",
    async (c) => {
      const parameters = await requestParametersValidator.validate(
        c.req.param(),
      );
      const body = await requestBodyValidator.validate(await c.req.json());
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
