import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import vine from "@vinejs/vine";

const requestBodySchema = vine.object({ url: vine.string().url() });
const requestBodyValidator = vine.compile(requestBodySchema);

export const validateUrl = (router: Hono) => {
  router.post(
    "/url",
    async (c) => {
      const data = await requestBodyValidator.validate(await c.req.json());
      const [feed] = c.get("database").sql<
        { id: string }
      >`select id from feeds where url = ${new URL(data.url).toString()}`;

      if (feed) {
        throw new HTTPException(409, { message: "Feed url already exists" });
      }

      const { title } = await c.get("feedService")
        .verifyFeed(data.url, {
          signal: AbortSignal.any([
            c.get("shutdown"),
            c.req.raw.signal,
          ]),
        }).catch((error) => {
          throw new HTTPException(422, {
            message: "Invalid feed url",
            cause: error,
          });
        });

      if (!title) {
        throw new HTTPException(422, { message: "No title for feed" });
      }

      return c.json({ data: { title } });
    },
  );
};
