import { Readable } from "node:stream";
import type { Hono } from "hono";
import { opmlViews } from "../../views/mod.js";

export const handler = (router: Hono) => {
  router.get("/opml/import", (c) => {
    return c.html(opmlViews.pages.Import());
  });

  router.post("/opml/import", async (c) => {
    await c.get("services").api.opmlService.import({
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      body: Readable.fromWeb(c.req.raw.body as any),
      headers: {
        "content-length": c.req.header("content-length") ?? "",
        "content-type": c.req.header("content-type") ?? "",
      },
    });

    return c.text("ok");
  });
};
