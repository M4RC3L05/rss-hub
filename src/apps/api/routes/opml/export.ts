import { escape } from "@std/html";
import type { Hono } from "@hono/hono";
import { stream } from "@hono/hono/streaming";

export const exportFeeds = (router: Hono) => {
  router.get("/export", (c) => {
    const categories = c
      .get("database")
      .prepare(`select * from categories order by name`)
      .iter() as IterableIterator<
        { id: string; name: string }
      >;

    c.res.headers.set("content-type", "text/x-opml");
    c.res.headers.set(
      "content-disposition",
      'attachment; filename="feeds.opml"',
    );

    return stream(c, async (stream) => {
      await stream.writeln(
        `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n<head>\n<title>RSS HUB feeds</title>\n<dateCreated>${
          new Date().toUTCString()
        }</dateCreated>\n</head>\n<body>`.trim(),
      );

      for (const category of categories) {
        const text = escape(category.name);
        await stream.writeln(`<outline text="${text}">`);

        const feeds = c
          .get("database")
          .prepare(`select * from feeds where category_id = ? order by name`)
          .iter(
            category.id,
          ) as IterableIterator<{ name: string; url: string }>;

        for (const feed of feeds) {
          const text = escape(feed.name);
          const xmlUrl = escape(feed.url);

          await stream.writeln(
            `<outline text="${text}" type="rss" xmlUrl="${xmlUrl}"/>`,
          );
        }

        await stream.writeln("</outline>");
      }

      await stream.writeln("</body>\n</opml>");
    });
  });
};
