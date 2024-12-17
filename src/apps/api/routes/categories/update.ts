import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
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
      const [updated] = c.get("database").sql<{ id: string }>`
        update categories set name = ${body.name}
        where id = ${parameters.id}
        returning id
      `;

      if (!updated) {
        throw new HTTPException(404, { message: "Category not found" });
      }

      const [category] = c.get("database").sql<CategoriesTable>`
        select id, name, created_at as "createdAt", updated_at as "updatedAt"
        from categories
        where id = ${updated.id}
      `;

      return c.json({ data: category });
    },
  );
};
