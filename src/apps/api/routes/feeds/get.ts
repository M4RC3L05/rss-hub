import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import vine from "@vinejs/vine";
import type { FeedsTable } from "#src/database/types/mod.ts";

const requestParametersSchema = vine.object({ id: vine.string().uuid() });
const requestParametersValidator = vine.compile(requestParametersSchema);

export const get = (router: Hono) => {
  router.get(
    "/:id",
    async (c) => {
      const parameters = await requestParametersValidator.validate(
        c.req.param(),
      );
      const feed = c.get("database").get<FeedsTable>(sql`
        select * from feeds
        where id = ${parameters.id}
      `);

      if (!feed) {
        throw new HTTPException(404, { message: "Could not find feed" });
      }

      return c.json({ data: feed }, 200);
    },
  );
};
