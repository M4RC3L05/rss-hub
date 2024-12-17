import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import { HTTPException } from "@hono/hono/http-exception";

const requestParametersSchema = vine.object({ id: vine.string().uuid() });
const requestParametersValidator = vine.compile(requestParametersSchema);

export const del = (router: Hono) => {
  router.delete(
    "/:id",
    async (c) => {
      const parameters = await requestParametersValidator.validate(
        c.req.param(),
      );

      const [deleted] = c.get("database").sql`
        delete from categories
        where id = ${parameters.id}
        returning id
      `;

      if (!deleted) {
        throw new HTTPException(404, { message: "Category not found" });
      }

      return c.body(null, 204);
    },
  );
};
