import { sql } from "@m4rc3l05/sqlite-tag";
import { escape } from "@std/html";
import type { Hono } from "hono";

const handler = (router: Hono) => {
  return router.get("/export", (c) => {
    let doc =
      `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>RSS HUB feeds</title><dateCreated>${
        new Date().toUTCString()
      }</dateCreated></head><body>`.trim();

    const categories = c
      .get("database")
      .iterate<{ id: string; name: string }>(sql`select * from categories`);

    for (const category of categories) {
      const text = escape(category.name);
      doc += `<outline text="${text}">`;

      const feeds = c
        .get("database")
        .iterate<{ name: string; url: string }>(
          sql`select * from feeds where category_id = ${category.id}`,
        );

      for (const feed of feeds) {
        const text = escape(feed.name);
        const xmlUrl = escape(feed.url);
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
