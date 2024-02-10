import type { Hono } from "hono";
import { stream } from "hono/streaming";

export const handler = (router: Hono) => {
  router.get("/opml/export", async (c) => {
    const response = await c.get("services").api.opmlService.export();

    c.header("content-type", response.headers.get("content-type") ?? "");
    c.header(
      "content-disposition",
      response.headers.get("content-disposition") ?? "",
    );

    return stream(c, async (x) => {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      for await (const chunk of response.body!) {
        await x.write(chunk);
      }
    });
  });
};
