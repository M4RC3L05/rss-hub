import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import vine from "@vinejs/vine";
import type { CategoriesTable } from "#src/database/types/mod.ts";

const requestParametersSchema = vine.object({ id: vine.string().uuid() });
const requestParametersValidator = vine.compile(requestParametersSchema);

export const get = (router: Hono) => {
  router.get(
    "/:id",
    async (c) => {
      const { id } = await requestParametersValidator.validate(c.req.param());
      const [category] = c.get("database").sql<CategoriesTable>`
        select id, name, created_at as "createdAt", updated_at as "updatedAt"
        from categories
        where id = ${id}
      `;

      if (!category) {
        throw new HTTPException(404, { message: "Could not find category" });
      }

      return c.json({ data: category });
    },
  );
};
