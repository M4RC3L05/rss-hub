import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";

const requestQuerySchema = z.object({ url: z.string() }).strict();

export const handler = (router: Hono) => {
  router.get(
    "/feeds/verify-url",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      const { url } = c.req.valid("query");

      const { data } = await c
        .get("services")
        .api.feedsService.verifyUrl({ data: { url } });

      return c.text(data.title);
    },
  );
};
