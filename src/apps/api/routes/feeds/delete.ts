import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import vine from "@vinejs/vine";
import { makeLogger } from "#src/common/logger/mod.ts";

const requestParametersSchema = vine.object({ id: vine.string().uuid() });
const requestParametersValidator = vine.compile(requestParametersSchema);

const log = makeLogger("delete-feed-handler");

export const del = (router: Hono) => {
  router.delete(
    "/:id",
    async (c) => {
      const parameters = await requestParametersValidator.validate(
        c.req.param(),
      );
      const changes = c.get("database").execute(sql`
        delete from feeds
        where id = ${parameters.id}
      `);

      if (changes === 0) {
        log.warn("No feed was deleted", { feedId: parameters.id });
      }

      return c.body(null, 204);
    },
  );
};
