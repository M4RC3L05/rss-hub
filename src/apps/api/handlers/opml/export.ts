import sql from "@leafac/sqlite";
import { encodeXML } from "entities";
import { type RouteMiddleware } from "@m4rc3l05/sss";
import { db } from "../../../../database/mod.js";

export const handler: RouteMiddleware = async (request, response) => {
  let doc =
    `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>RSS HUB feeds</title><dateCreated>${new Date().toUTCString()}</dateCreated></head><body>`.trim();

  for (const category of db.iterate<{ id: string; name: string }>(sql`select * from categories`)) {
    const text = encodeXML(category.name);
    doc += `<outline text="${text}">`;

    for (const feed of db.iterate<{ name: string; url: string }>(
      sql`select * from feeds where category_id = ${category.id}`,
    )) {
      const text = encodeXML(feed.name);
      const xmlUrl = encodeXML(feed.url);
      doc += `<outline text="${text}" type="rss" xmlUrl="${xmlUrl}"/>`;
    }

    doc += `</outline>`;
  }

  doc += `</body></opml>`;

  response.statusCode = 200;

  response.setHeader("content-disposition", 'attachment; filename="feeds.opml"');
  response.setHeader("content-type", "text/x-opml");
  response.end(doc.trim());
};
