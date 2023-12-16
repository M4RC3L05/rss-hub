import { type Hono } from "hono";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { feedService } from "../../../../services/mod.js";
import { makeLogger } from "../../../../common/logger/mod.js";
import { RequestValidationError } from "../../../../errors/mod.js";

const requestBodySchema = z
  .object({
    url: z.string().url(),
  })
  .strict();

const log = makeLogger("validate-feed-url-handler");

export const handler = (router: Hono) => {
  router.post(
    "/api/feeds/url",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success) throw new RequestValidationError({ request: { body: result.error } });
    }),
    async (c) => {
      try {
        const data = c.req.valid("json");
        const extracted = await feedService.verifyFeed(data.url);
        const title = feedService.getFeedTitle(extracted);

        return c.json({ data: { title } });
      } catch (error) {
        log.error(error, "Error while checking feed url");

        throw new HTTPException(422, { message: "Invalid feed url" });
      }
    },
  );
};
