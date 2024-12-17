import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";

const requestQuerySchema = vine.object({ url: vine.string().url() });
const requestQueryValidator = vine.compile(requestQuerySchema);

export const searchFeedLinks = (router: Hono) => {
  router.get("/feed-links", async (c) => {
    const { url } = await requestQueryValidator.validate(
      c.req.query(),
    );

    const feedLinks = await c.get("feedService").getFeedLinks(url, {
      signal: AbortSignal.any([
        c.get("shutdown"),
        c.req.raw.signal,
      ]),
    });

    return c.json({ data: feedLinks });
  });
};
