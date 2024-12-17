import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import type { CategoriesTable } from "#src/database/types/mod.ts";
import vine from "@vinejs/vine";

const requestBodySchema = vine.object({ name: vine.string().minLength(2) });
const requestBodyValidator = vine.compile(requestBodySchema);

export const create = (router: Hono) => {
  router.post(
    "/",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());
      const [category] = c.get("database").sql<CategoriesTable>`
        insert into categories (name)
        values (${data.name})
        returning id, name, created_at as "createdAt", updated_at as "updatedAt"
      `;

      if (!category) {
        throw new HTTPException(400, { message: "Could not create category" });
      }

      return c.json({ data: category }, 201);
    },
  );
};
