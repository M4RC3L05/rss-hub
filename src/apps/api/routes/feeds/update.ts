import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import vine from "@vinejs/vine";
import type { FeedsTable } from "#src/database/mod.ts";

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

      const [feed] = c.get("database").sql<FeedsTable>`
        update feeds
          set
            name = coalesce(${data.name ?? null}, name),
            url = coalesce(
              ${data.url ? new URL(data.url).toString() : null},
              url
            ),
            category_id = coalesce(${data.categoryId ?? null}, category_id)
        where id = ${parameters.id}
        returning
          id, name, url,
          category_id as "categoryId",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      if (!feed) {
        throw new HTTPException(404, { message: "Category not found" });
      }

      return c.json({ data: feed });
    },
  );
};
