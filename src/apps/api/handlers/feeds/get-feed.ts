import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { FeedsTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestParametersSchema = z.object({ id: z.string().uuid() }).strict();

export const handler = (router: Hono) => {
  router.get(
    "/api/feeds/:id",
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
