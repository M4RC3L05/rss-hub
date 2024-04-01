import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import vine from "@vinejs/vine";
import { makeLogger } from "#src/common/logger/mod.ts";

const requestParametersSchema = vine.object({ id: vine.string().uuid() });
const requestParametersValidator = vine.compile(requestParametersSchema);

const log = makeLogger("delete-category-handler");

const handler = (router: Hono) => {
  return router.delete(
    "/:id",
    async (c) => {
      const parameters = await requestParametersValidator.validate(
        c.req.param(),
      );

      const changes = c.get("database").execute(sql`
        delete from categories
        where id = ${parameters.id}
        returning *
      `);

      if (changes === 0) {
        log.warn("No category was deleted", { categoryId: parameters.id });
      }

      return c.body(null, 204);
    },
  );
};

export default handler;
