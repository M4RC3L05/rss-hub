import type {
  CategoriesTable,
  CustomDatabase,
  FeedItemsTable,
  FeedsTable,
} from "#src/database/mod.ts";

export const loadCategory = (
  db: CustomDatabase,
  data?: Partial<CategoriesTable>,
) => {
  return db.sql<CategoriesTable>`
    insert into categories (
      id, name, created_at, updated_at
    )
    values (
      ${data?.id ?? crypto.randomUUID()},
      ${data?.name ?? Math.random().toString(32).slice(2)},
      ${data?.createdAt ?? new Date().toISOString()},
      ${data?.updatedAt ?? new Date().toISOString()}
    )
    returning id, name, created_at as "createdAt", updated_at as "updatedAt"
  `.at(0)!;
};

export const loadFeed = (
  db: CustomDatabase,
  data: Partial<FeedsTable> = {},
) => {
  if (!data?.categoryId) {
    const category = loadCategory(db);
    data.categoryId = category.id;
  }

  return db.sql<FeedsTable>`
    insert into feeds (
      id, name, url, category_id, created_at, updated_at
    )
    values (
      ${data.id ?? crypto.randomUUID()},
      ${data.name ?? "foo"},
      ${data.url ?? `https://${Math.random().toString(32).slice(2)}.com/rss`},
      ${data.categoryId},
      ${data.createdAt ?? new Date().toISOString()},
      ${data.updatedAt ?? new Date().toISOString()}
    )
    returning id, name, url, category_id as "categoryId", created_at as "createdAt", updated_at as "updatedAt"
  `.at(0)!;
};

export const loadFeedItem = (
  db: CustomDatabase,
  data: Partial<FeedItemsTable> = {},
) => {
  if (!data?.feedId) {
    const feed = loadFeed(db);
    data.feedId = feed.id;
  }

  return db.sql<FeedItemsTable>`
    insert into feed_items (
      id, title, enclosure, link, img, content, feed_id, readed_at, bookmarked_at, created_at, updated_at
    )
    values (
      ${data.id ?? crypto.randomUUID()},
      ${data.title ?? "foo"},
      ${data.enclosure ?? null},
      ${data.link ?? null},
      ${data.img ?? null},
      ${data.content ?? "foo bar biz"},
      ${data.feedId},
      ${data.readedAt ?? null},
      ${data.bookmarkedAt ?? null},
      ${data.createdAt ?? new Date().toISOString()},
      ${data.updatedAt ?? new Date().toISOString()}
    )
    returning id, title, enclosure, link, img, content, feed_id as "feedId", readed_at as "readedAt", bookmarked_at as "bookmarkedAt", created_at as "createdAt", updated_at as "updatedAt"
  `.at(0)!;
};

export const maxOpmlImportPayload = new File(
  ["0".repeat((1024 * 1024 * 3) + 1)],
  "foo.opml",
  { type: "text/plain" },
);

export const opmlMalformedFileExport = new File(
  [`
    <?xml version="1.
    <opml version="2.0">
      <head>
        <title>Rody>
    </opml>
  `.trim()],
  "foo.opml",
  { type: "text/plain" },
);

export const opmlWithOneItemsFileExport = new File(
  [`
    <?xml version="1.0" encoding="UTF-8"?>
    <opml version="2.0">
      <head>
        <title>RSS HUB feeds</title>
        <dateCreated>Thu, 01 Jan 1970 00:00:00 GMT</dateCreated>
      </head>
      <body>
        <outline text="cat:bar">
          <outline text="feed:biz" type="rss" xmlUrl="feed:url:biz"/>
        </outline>
      </body>
    </opml>
  `.trim()],
  "foo.opml",
  { type: "text/plain" },
);

export const opmlWithItemsFileExport = new File(
  [`
    <?xml version="1.0" encoding="UTF-8"?>
    <opml version="2.0">
      <head>
        <title>RSS HUB feeds</title>
        <dateCreated>Thu, 01 Jan 1970 00:00:00 GMT</dateCreated>
      </head>
      <body>
        <outline text="cat:bar">
          <outline text="feed:biz" type="rss" xmlUrl="feed:url:biz"/>
          <outline text="feed:biz" type="rss" xmlUrl="feed:url:biz"/>
          <outline text="feed:biz" type="rss" _xmlUrl="feed:url:biz"/>
        </outline>
        <outline text="cat:biz">
        </outline>
        <outline _texts="cat:buz">
        </outline>
        <outline text="cat:foo">
          <outline text="feed:bar" type="rss" htmlUrl="feed:url:bar"/>
          <outline text="feed:foo" type="rss" xmlUrl="feed:url:foo"/>
        </outline>
      </body>
    </opml>
  `.trim()],
  "foo.opml",
  { type: "text/plain" },
);

export const opmlEmptyFileExport = new File(
  [`
    <?xml version="1.0" encoding="UTF-8"?>
    <opml version="2.0">
      <head>
        <title>RSS HUB feeds</title>
        <dateCreated>Thu, 01 Jan 1970 00:00:00 GMT</dateCreated>
      </head>
      <body>
      </body>
    </opml>
  `.trim()],
  "foo.opml",
  { type: "text/plain" },
);
