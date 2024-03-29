import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import { z } from "zod";
import { makeLogger } from "#src/common/logger/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestParametersSchema = z.object({ id: z.string().uuid() }).strict();

const log = makeLogger("delete-feed-handler");

const handler = (router: Hono) => {
  return router.delete(
    "/:id",
    zValidator("param", requestParametersSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const parameters = c.req.valid("param");
      const { changes } = c.get("database").run(sql`
        delete from feeds
        where id = ${parameters.id}
      `);

      if (changes === 0) {
        log.warn({ feedId: parameters.id }, "No feed was deleted");
      }

      return c.body(null, 204);
    },
  );
};

export default handler;
