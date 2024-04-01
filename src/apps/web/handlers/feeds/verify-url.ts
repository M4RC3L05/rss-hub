import type { Hono } from "hono";

export const handler = (router: Hono) => {
  router.get(
    "/feeds/verify-url",
    async (c) => {
      const { url } = c.req.query();

      const { data } = await c.get("services").api.feedsService.verifyUrl({
        data: { url },
        signal: c.req.raw.signal,
      });

      return c.text(data.title);
    },
  );
};
