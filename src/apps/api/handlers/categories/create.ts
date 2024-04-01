import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { CategoriesTable } from "#src/database/types/mod.ts";
import vine from "@vinejs/vine";

const requestBodySchema = vine.object({ name: vine.string().minLength(2) });
const requestBodyValidator = vine.compile(requestBodySchema);

const handler = (router: Hono) => {
  return router.post(
    "/",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());
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
