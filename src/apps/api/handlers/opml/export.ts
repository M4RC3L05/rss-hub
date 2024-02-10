import sql from "@leafac/sqlite";
import { encodeXML } from "entities";
import type { Hono } from "hono";

const handler = (router: Hono) => {
  return router.get("/export", (c) => {
    let doc =
      `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>RSS HUB feeds</title><dateCreated>${new Date().toUTCString()}</dateCreated></head><body>`.trim();

    for (const category of c
      .get("database")
      .iterate<{ id: string; name: string }>(sql`select * from categories`)) {
      const text = encodeXML(category.name);
      doc += `<outline text="${text}">`;

      for (const feed of c
        .get("database")
        .iterate<{ name: string; url: string }>(
          sql`select * from feeds where category_id = ${category.id}`,
        )) {
        const text = encodeXML(feed.name);
        const xmlUrl = encodeXML(feed.url);
        doc += `<outline text="${text}" type="rss" xmlUrl="${xmlUrl}"/>`;
      }

      doc += "</outline>";
    }

    doc += "</body></opml>";

    return c.body(doc.trim(), 200, {
      "content-type": "text/x-opml",
      "content-disposition": 'attachment; filename="feeds.opml"',
    });
  });
};

export default handler;
