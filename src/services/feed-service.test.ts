import {
  type CustomDatabase,
  type FeedItemsTable,
  makeDatabase,
} from "#src/database/mod.ts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import {
  assertEquals,
  assertInstanceOf,
  assertNotEquals,
  assertRejects,
} from "@std/assert";
import { testDbUtils } from "#src/common/utils/mod.ts";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
import {
  assertSpyCallArgs,
  assertSpyCalls,
  spy,
  stub,
} from "@std/testing/mock";
import FeedService from "#src/services/feed-service.ts";
import { makeLogger } from "#src/common/logger/mod.ts";

const log = makeLogger("feed-service");
let db: CustomDatabase;

beforeAll(async () => {
  db = makeDatabase();

  await testDbUtils.runMigrations(db);
});

beforeEach(() => {
  db.exec("delete from categories");
  db.exec("delete from feeds");
  db.exec("delete from feed_items");
});

afterAll(() => {
  db.close();
});

describe("FeedService", () => {
  describe("getFeedLinks()", () => {
    it("should throw an error if request is not ok", async () => {
      const feedService = new FeedService(db);
      const response = new Response("", { status: 400 });

      using fetchStub = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(response),
      );

      const error = await assertRejects(
        () => feedService.getFeedLinks("https://example.com"),
      );

      assertSpyCalls(fetchStub, 1);
      assertInstanceOf(error, Error);
      assertEquals(error.message, "Could not fetch page");
      assertEquals(error.cause, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
        type: response.type,
        url: response.url,
      });
    });

    it("should extract feed links from link tags", async () => {
      const feedService = new FeedService(db);

      using fetchStub = stub(
        globalThis,
        "fetch",
        () =>
          Promise.resolve(
            new Response(
              `
                <head>
                  <link type="application/rss+xml" href="../foo/bar">
                  <link type="application/rss" href="https://foo.com/foo/bar">
                  <link type="application/atom+xml" href="/foo/bar">
                  <link type="application/atom" href="foo/bar">
                  <link type="application/feed+json" href="baz">
                  <link type="application/json" href="biz">
                  <link type="text/plain" href="buz">
                </head>
              `,
              { status: 200 },
            ),
          ),
      );

      const links = await feedService.getFeedLinks(
        "https://example.com/foo/bar",
      );

      assertSpyCalls(fetchStub, 1);
      assertEquals(links, [
        "https://example.com/foo/bar",
        "https://foo.com/foo/bar",
        "https://example.com/foo/bar",
        "https://example.com/foo/foo/bar",
        "https://example.com/foo/baz",
        "https://example.com/foo/biz",
      ]);
    });

    it("should log warn if it fails to fetch sitemap", async () => {
      const feedService = new FeedService(db);
      const badResponse = new Response("", { status: 400 });

      using fetchStub = stub(
        globalThis,
        "fetch",
        (input) => {
          if (input.toString().includes("sitemap.xml")) {
            return Promise.resolve(badResponse);
          }

          return Promise.resolve(new Response("", { status: 200 }));
        },
      );
      using logWranSpy = spy(log, "warn");

      const links = await feedService.getFeedLinks(
        "https://example.com/foo/bar",
      );

      assertSpyCalls(fetchStub, 2);
      assertSpyCalls(logWranSpy, 1);
      assertSpyCallArgs(logWranSpy, 0, ["Unable to fetch sitemap, skipping", {
        response: {
          headers: badResponse.headers,
          status: badResponse.status,
          statusText: badResponse.statusText,
          type: badResponse.type,
          url: badResponse.url,
        },
      }]);
      assertEquals(links, []);
    });

    it("should extract feed links from sitemap urlset if no link tags", async () => {
      const feedService = new FeedService(db);

      using fetchStub = stub(
        globalThis,
        "fetch",
        (input) => {
          if (input.toString().includes("sitemap.xml")) {
            return Promise.resolve(
              new Response(
                `
                <?xml version="1.0" encoding="UTF-8"?>
                <urlset xmlns="http://www.sitemaps.org/schemas/sitemap-image/1.1"
                        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap-image/1.1
                        http://www.sitemaps.org/schemas/sitemap-image/1.1/sitemap-image.xsd">
                    <url><loc>../foo/bar/rss</loc></url>
                    <url><loc>https://foo.com/foo/bar/rss.xml</loc></url>
                    <url><loc>/foo/bar/feed</loc></url>
                    <url><loc>foo/bar/feed.xml</loc></url>
                    <url><loc>/atom</loc></url>
                    <url><loc>baz/atom.xml</loc></url>
                    <url><loc>buz/json</loc></url>
                    <url><loc>foobar</loc></url>
                </urlset>
              `,
                { status: 200 },
              ),
            );
          }

          return Promise.resolve(new Response("", { status: 200 }));
        },
      );

      const links = await feedService.getFeedLinks(
        "https://example.com/foo/bar",
      );

      assertSpyCalls(fetchStub, 2);
      assertEquals(links, [
        "https://example.com/foo/bar/rss",
        "https://foo.com/foo/bar/rss.xml",
        "https://example.com/foo/bar/feed",
        "https://example.com/foo/foo/bar/feed.xml",
        "https://example.com/atom",
        "https://example.com/foo/baz/atom.xml",
        "https://example.com/foo/buz/json",
      ]);
    });

    it("should extract feed links from sitemap sitemapindex if no link tags", async () => {
      const feedService = new FeedService(db);

      using fetchStub = stub(
        globalThis,
        "fetch",
        (input) => {
          if (input.toString().includes("sitemap.xml")) {
            return Promise.resolve(
              new Response(
                `
                <?xml version="1.0" encoding="UTF-8"?>
                <sitemapindex
                        xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
                        xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance"
                        xsi:schemaLocation="https://www.sitemaps.org/schemas/sitemap/0.9
                              https://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
                    <sitemap><loc>../foo/bar/rss</loc></sitemap>
                    <sitemap><loc>https://foo.com/foo/bar/rss.xml</loc></sitemap>
                    <sitemap><loc>/foo/bar/feed</loc></sitemap>
                    <sitemap><loc>foo/bar/feed.xml</loc></sitemap>
                    <sitemap><loc>/atom</loc></sitemap>
                    <sitemap><loc>baz/atom.xml</loc></sitemap>
                    <sitemap><loc>buz/json</loc></sitemap>
                    <sitemap><loc>foobar</loc></sitemap>
                </sitemapindex>
              `,
                { status: 200 },
              ),
            );
          }

          return Promise.resolve(new Response("", { status: 200 }));
        },
      );

      const links = await feedService.getFeedLinks(
        "https://example.com/foo/bar",
      );

      assertSpyCalls(fetchStub, 2);
      assertEquals(links, [
        "https://example.com/foo/bar/rss",
        "https://foo.com/foo/bar/rss.xml",
        "https://example.com/foo/bar/feed",
        "https://example.com/foo/foo/bar/feed.xml",
        "https://example.com/atom",
        "https://example.com/foo/baz/atom.xml",
        "https://example.com/foo/buz/json",
      ]);
    });
  });

  describe("syncFeed()", () => {
    it("should not sync if feed resturns a 304 status code", async () => {
      const feed = testFixtures.loadFeed(db, { url: "https://example.com" });

      using fetchStub = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(new Response(null, { status: 304 })),
      );
      using logInfoSpy = spy(log, "info");

      const result = await new FeedService(db).syncFeed(feed);

      assertSpyCalls(fetchStub, 1);
      assertSpyCalls(logInfoSpy, 1);
      assertSpyCallArgs(logInfoSpy, 0, ["No content extracted, ignoring", {
        feed,
      }]);
      assertEquals(result, {
        totalCount: 0,
        successCount: 0,
        faildCount: 0,
        failedReasons: [],
      });
    });

    it("should throw an error if fetch feed content fails", async () => {
      const feed = testFixtures.loadFeed(db, { url: "https://example.com" });
      const response = new Response("", { status: 400 });

      using fetchStub = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(response),
      );

      const error = await assertRejects(() =>
        new FeedService(db).syncFeed(feed)
      );

      assertSpyCalls(fetchStub, 1);
      assertInstanceOf(error, Error);
      assertEquals(
        error.message,
        "Could not fetch feed contents from https://example.com",
      );
      assertEquals(error.cause, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
        type: response.type,
        url: response.url,
      });
    });

    it("should throw an error if unable to get test contents from response", async () => {
      const feed = testFixtures.loadFeed(db, { url: "https://example.com" });
      const textError = new Error("foo");

      using fetchStub = stub(
        globalThis,
        "fetch",
        () =>
          Promise.resolve(
            {
              ok: true,
              status: 200,
              text: () => Promise.reject(textError),
              // deno-lint-ignore no-explicit-any
            } as any,
          ),
      );

      const error = await assertRejects(() =>
        new FeedService(db).syncFeed(feed)
      );

      assertSpyCalls(fetchStub, 1);
      assertInstanceOf(error, Error);
      assertEquals(
        error.message,
        "Unable to extract text content https://example.com",
      );
      assertEquals(error.cause, textError);
    });

    it("should sync a feed", async () => {
      const feed = testFixtures.loadFeed(db, { url: "https://example.com" });

      using fetchStub = stub(
        globalThis,
        "fetch",
        () =>
          Promise.resolve(Response.json({
            title: "foo",
            items: [{
              id: "https://www.example.com/blog/post1",
              title: "Blog Post 1",
              url: "https://www.example.com/blog/post1",
              content_text:
                "This is the first blog post. It covers various topics.",
              date_published: "2023-10-01T12:00:00Z",
              date_modified: "2023-10-01T12:00:00Z",
              image: "https://www.example.com/blog/post1/image.jpg",
              attachments: [
                {
                  url: "https://www.example.com/blog/post1/attachment.pdf",
                  title: "Attachment PDF",
                  mime_type: "application/pdf",
                  size: 123456,
                },
              ],
            }, {
              title: "Blog Post 2",
              url: "https://www.example.com/blog/post2",
              content_html:
                "<p>This is the first blog post. It covers various topics.</p>",
              date_published: "2023-10-01T12:00:00Z",
              date_modified: "2023-10-01T12:00:00Z",
              attachments: [],
            }, {
              id: "https://www.example.com/blog/post3",
              title: "Blog Post 3",
              url: "https://www.example.com/blog/post3",
              summary: "A brief summary of the first blog post.",
              date_published: "2023-10-01T12:00:00Z",
              image: "https://www.example.com/blog/post1/image.jpg",
            }],
          })),
      );

      const result = await new FeedService(db).syncFeed(feed);

      assertSpyCalls(fetchStub, 1);
      assertEquals(result, {
        totalCount: 3,
        successCount: 3,
        faildCount: 0,
        failedReasons: [],
      });
      assertEquals(
        db.sql`
          select
            id, title, enclosure, link, img, content,
            feed_id as "feedId",
            readed_at as "readedAt",
            bookmarked_at as "bookmarkedAt",
            created_at as "createdAt",
            updated_at as "updatedAt"
          from feed_items
          order by title
        `,
        [
          {
            bookmarkedAt: null,
            content: "This is the first blog post. It covers various topics.",
            createdAt: "2023-10-01T12:00:00.000Z",
            enclosure:
              '[{"type":"application/pdf","url":"https://www.example.com/blog/post1/attachment.pdf"}]',
            feedId: feed.id,
            id: "https://www.example.com/blog/post1",
            img: "https://www.example.com/blog/post1/image.jpg",
            link: "https://www.example.com/blog/post1",
            readedAt: null,
            title: "Blog Post 1",
            updatedAt: "2023-10-01T12:00:00.000Z",
          },
          {
            bookmarkedAt: null,
            content:
              "<p>This is the first blog post. It covers various topics.</p>",
            createdAt: "2023-10-01T12:00:00.000Z",
            enclosure: "[]",
            feedId: feed.id,
            id:
              "IRU2s7IHU2jDYHmTjTXJ2qo9clDrCoFdVzJhW6natfpYrhyifLuCYbIaGfPrwN1CPmlAlr7iHeu51HAXv5iYfw==",
            img: null,
            link: "https://www.example.com/blog/post2",
            readedAt: null,
            title: "Blog Post 2",
            updatedAt: "2023-10-01T12:00:00.000Z",
          },
          {
            bookmarkedAt: null,
            content: "A brief summary of the first blog post.",
            createdAt: "2023-10-01T12:00:00.000Z",
            enclosure: "[]",
            feedId: feed.id,
            id: "https://www.example.com/blog/post3",
            img: "https://www.example.com/blog/post1/image.jpg",
            link: "https://www.example.com/blog/post3",
            readedAt: null,
            title: "Blog Post 3",
            updatedAt: "2023-10-01T12:00:00.000Z",
          },
        ],
      );
    });

    it("should sync a feed with previous items on db", async () => {
      const feed = testFixtures.loadFeed(db, { url: "https://example.com" });
      const feedItem = testFixtures.loadFeedItem(db, {
        feedId: feed.id,
        id: "https://www.example.com/blog/post3",
        enclosure: "foobar",
        updatedAt: new Date(Date.now() - (1000 * 60)).toISOString(),
      });

      using fetchStub = stub(
        globalThis,
        "fetch",
        () =>
          Promise.resolve(Response.json({
            title: "foo",
            items: [{
              id: "https://www.example.com/blog/post1",
              title: "Blog Post 1",
              url: "https://www.example.com/blog/post1",
              content_text:
                "This is the first blog post. It covers various topics.",
              date_published: "2023-10-01T12:00:00Z",
              date_modified: "2023-10-01T12:00:00Z",
              image: "https://www.example.com/blog/post1/image.jpg",
              attachments: [
                {
                  url: "https://www.example.com/blog/post1/attachment.pdf",
                  title: "Attachment PDF",
                  mime_type: "application/pdf",
                  size: 123456,
                },
              ],
            }, {
              title: "Blog Post 2",
              url: "https://www.example.com/blog/post2",
              content_html:
                "<p>This is the first blog post. It covers various topics.</p>",
              date_published: "2023-10-01T12:00:00Z",
              date_modified: "2023-10-01T12:00:00Z",
              attachments: [],
            }, {
              id: "https://www.example.com/blog/post3",
              title: "Blog Post 3",
              url: "https://www.example.com/blog/post3",
              summary: "A brief summary of the first blog post.",
              image: "https://www.example.com/blog/post1/image.jpg",
            }],
          })),
      );

      const result = await new FeedService(db).syncFeed(feed);
      const feedItems = db.sql<FeedItemsTable>`
      select
        id, title, enclosure, link, img, content,
        feed_id as "feedId",
        readed_at as "readedAt",
        bookmarked_at as "bookmarkedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from feed_items
      order by title
    `;

      assertSpyCalls(fetchStub, 1);
      assertEquals(result, {
        totalCount: 3,
        successCount: 3,
        faildCount: 0,
        failedReasons: [],
      });
      assertEquals(
        feedItems,
        [
          {
            bookmarkedAt: null,
            content: "This is the first blog post. It covers various topics.",
            createdAt: "2023-10-01T12:00:00.000Z",
            enclosure:
              '[{"type":"application/pdf","url":"https://www.example.com/blog/post1/attachment.pdf"}]',
            feedId: feed.id,
            id: "https://www.example.com/blog/post1",
            img: "https://www.example.com/blog/post1/image.jpg",
            link: "https://www.example.com/blog/post1",
            readedAt: null,
            title: "Blog Post 1",
            updatedAt: "2023-10-01T12:00:00.000Z",
          },
          {
            bookmarkedAt: null,
            content:
              "<p>This is the first blog post. It covers various topics.</p>",
            createdAt: "2023-10-01T12:00:00.000Z",
            enclosure: "[]",
            feedId: feed.id,
            id:
              "IRU2s7IHU2jDYHmTjTXJ2qo9clDrCoFdVzJhW6natfpYrhyifLuCYbIaGfPrwN1CPmlAlr7iHeu51HAXv5iYfw==",
            img: null,
            link: "https://www.example.com/blog/post2",
            readedAt: null,
            title: "Blog Post 2",
            updatedAt: "2023-10-01T12:00:00.000Z",
          },
          {
            bookmarkedAt: null,
            content: "A brief summary of the first blog post.",
            createdAt: feedItem.createdAt,
            enclosure: "[]",
            feedId: feed.id,
            id: "https://www.example.com/blog/post3",
            img: "https://www.example.com/blog/post1/image.jpg",
            link: "https://www.example.com/blog/post3",
            readedAt: null,
            title: "Blog Post 3",
            updatedAt: feedItems.at(-1)!.updatedAt,
          },
        ],
      );
      assertNotEquals(feedItems.at(-1)?.updatedAt, feedItem.updatedAt);
    });
  });
});
