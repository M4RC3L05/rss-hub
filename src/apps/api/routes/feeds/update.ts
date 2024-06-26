import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import vine from "@vinejs/vine";
import { mapKeys } from "@std/collections";
import { toSnakeCase } from "@std/text";

const requestParametersSchema = vine.object({ id: vine.string().uuid() });
const requestParametersValidator = vine.compile(requestParametersSchema);

const requestBodySchema = vine.object({
  name: vine.string().minLength(2).optional(),
  url: vine.string().url().optional(),
  categoryId: vine.string().uuid().optional(),
});
const requestBodyValidator = vine.compile(requestBodySchema);

export const update = (router: Hono) => {
  router.patch(
    "/:id",
    async (c) => {
      const parameters = await requestParametersValidator.validate(
        c.req.param(),
      );
      const data = await requestBodyValidator.validate(await c.req.json());
      const feed = c.get("database").get(sql`
        update feeds set ${sql.set(mapKeys(data, (key) => toSnakeCase(key)))}
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
