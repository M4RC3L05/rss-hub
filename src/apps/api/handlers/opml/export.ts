import type Router from "@koa/router";
import sql, { type Database } from "@leafac/sqlite";
import { type encodeXML } from "entities";

type ImportOpmlDeps = {
  db: Database;
  encodeEntitiesXml: typeof encodeXML;
};

export const handler = (deps: ImportOpmlDeps): Router.Middleware => {
  return async (ctx: Router.RouterContext) => {
    let doc =
      `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>RSS HUB feeds</title><dateCreated>${new Date().toUTCString()}</dateCreated></head><body>`.trim();

    for (const category of deps.db.iterate<{ id: string; name: string }>(
      sql`select * from categories`,
    )) {
      const text = deps.encodeEntitiesXml(category.name);
      doc += `<outline text="${text}">`;

      for (const feed of deps.db.iterate<{ name: string; url: string }>(
        sql`select * from feeds where category_id = ${category.id}`,
      )) {
        const text = deps.encodeEntitiesXml(feed.name);
        const xmlUrl = deps.encodeEntitiesXml(feed.url);
        doc += `<outline text="${text}" type="rss" xmlUrl="${xmlUrl}"/>`;
      }

      doc += `</outline>`;
    }

    doc += `</body></opml>`;

    ctx.set("content-disposition", "attachement; filename=feeds.opml");
    ctx.type = "text/xml";
    ctx.body = doc.trim();
  };
};
