import type { Hono } from "@hono/hono";
import { stream } from "@hono/hono/streaming";

export const exportFeeds = (router: Hono) => {
  router.get("/export", async (c) => {
    const response = await c.get("services").api.opmlService.export({
      signal: c.req.raw.signal,
    });

    c.header("content-type", response.headers.get("content-type") ?? "");
    c.header(
      "content-disposition",
      response.headers.get("content-disposition") ?? "",
    );

    return stream(c, async (x) => {
      for await (const chunk of response.body) {
        await x.write(chunk);
      }
    });
  });
};
