import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { FeedsTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestParametersSchema = z.object({ id: z.string().uuid() }).strict();

const handler = (router: Hono) => {
  return router.get(
    "/:id",
    zValidator("param", requestParametersSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const parameters = c.req.valid("param");
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

export default handler;
