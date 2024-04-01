import type { Hono } from "hono";
import { opmlViews } from "../../views/mod.ts";

export const handler = (router: Hono) => {
  router.get("/opml/import", (c) => {
    return c.html(opmlViews.pages.Import());
  });

  router.post("/opml/import", async (c) => {
    await c.get("services").api.opmlService.import({
      signal: c.req.raw.signal,
      body: c.req.raw.body!,
      headers: {
        "content-length": c.req.header("content-length") ?? "",
        "content-type": c.req.header("content-type") ?? "",
      },
    });

    return c.text("ok");
  });
};
