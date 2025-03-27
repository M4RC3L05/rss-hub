import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { assertSpyCallArg, assertSpyCalls, spy, stub } from "@std/testing/mock";
import { assertSnapshot } from "@std/testing/snapshot";
import { encodeBase64 } from "@std/encoding";
import { assertEquals } from "@std/assert";
import type { Hono } from "@hono/hono";
import { testDbUtils } from "#src/common/utils/mod.ts";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";

let db: CustomDatabase;
let app: Hono;

beforeAll(async () => {
  db = makeDatabase();
  await testDbUtils.runMigrations(db);

  app = makeApp({ database: db, shutdown: new AbortController().signal });
});

beforeEach(() => {
  db.exec("delete from categories");
  db.exec("delete from feeds");
  db.exec("delete from feed_items");
});

afterAll(() => {
  db.close();
});

describe("GET /api/feed-items/:id/:feedId/extract-content", () => {
  it("should throw a validation error if invalid request params data is provided", async () => {
    const response = await app.request(
      "/api/feed-items/foo/bar/extract-content",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Validation failed",
        validationErrors: [
          {
            field: "feedId",
            message: "The feedId field must be a valid UUID",
            rule: "uuid",
          },
        ],
      },
    });
  });

  it("should throw a validation error if invalid request params data is provided", async () => {
    const response = await app.request(
      `/api/feed-items/foo/${crypto.randomUUID()}/extract-content`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 404);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Feed item not found",
      },
    });
  });

  it("should return empty string if feed item does not provide a link", async () => {
    const feedItem = testFixtures.loadFeedItem(db, { link: null });

    using fetchSpy = spy(globalThis, "fetch");

    const response = await app.request(
      `/api/feed-items/${feedItem.id}/${feedItem.feedId}/extract-content`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: "" });
    assertSpyCalls(fetchSpy, 0);
  });

  it("should throw a 400 error if fetch call fails", async () => {
    const feedItem = testFixtures.loadFeedItem(db, {
      link: "https://example.com",
    });
    const fetchError = new Error("foo");

    using _ = stub(globalThis, "fetch", () => Promise.reject(fetchError));

    const response = await app.request(
      `/api/feed-items/${feedItem.id}/${feedItem.feedId}/extract-content`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data, {
      error: {
        code: "error",
        message: `Could not fetch "${feedItem.link}"`,
      },
    });
  });

  it("should throw a 400 error if fetch response is not ok", async () => {
    const feedItem = testFixtures.loadFeedItem(db, {
      link: "https://example.com",
    });

    using _ = stub(
      globalThis,
      "fetch",
      () => Promise.resolve(new Response("", { status: 400 })),
    );

    const response = await app.request(
      `/api/feed-items/${feedItem.id}/${feedItem.feedId}/extract-content`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data, {
      error: {
        code: "error",
        message: `Request to "${feedItem.link}" failed`,
      },
    });
  });

  it("should normalize page content links to open in new tab", async (t) => {
    const feedItem = testFixtures.loadFeedItem(db, {
      link: "https://example.com",
    });

    using fetchStub = stub(
      globalThis,
      "fetch",
      () =>
        Promise.resolve(
          new Response(
            `
          <html>
            <head></head>
            <body>
              <p>foo</p>
              <a href="">bar</a>
              <a href="/foo/bar">bar</a>
              <a href="https://example.com">bar</a>
              <a href="#foo">bar</a>
            </body>
          </html>
        `,
            { status: 200 },
          ),
        ),
    );

    const response = await app.request(
      `/api/feed-items/${feedItem.id}/${feedItem.feedId}/extract-content`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    await assertSnapshot(t, data);
    assertSpyCalls(fetchStub, 1);
    assertSpyCallArg(fetchStub, 0, 0, feedItem.link);
  });

  it("should normalize page content links urls", async (t) => {
    const feedItem = testFixtures.loadFeedItem(db, {
      link: "https://example.com/a/b/c.html",
    });

    using fetchStub = stub(
      globalThis,
      "fetch",
      () =>
        Promise.resolve(
          new Response(
            `
          <html>
            <head></head>
            <body>
              <p>foo</p>
              <a href="/foo/bar">bar</a>
              <a href="./foo/bar">bar2</a>
              <a href="../foo/bar">bar3</a>
              <video src="/foo/bar" />
              <audio srcset="/foo/bar" />
              <a href="https://example.com">bar</a>
            </body>
          </html>
        `,
            { status: 200 },
          ),
        ),
    );

    const response = await app.request(
      `/api/feed-items/${feedItem.id}/${feedItem.feedId}/extract-content`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    await assertSnapshot(t, data);
    assertSpyCalls(fetchStub, 1);
    assertSpyCallArg(fetchStub, 0, 0, feedItem.link);
  });

  it("should empty string if readablility cannot simplify content", async () => {
    const feedItem = testFixtures.loadFeedItem(db, {
      link: "https://example.com",
    });

    using _ = stub(
      globalThis,
      "fetch",
      () =>
        Promise.resolve(
          new Response(
            `
          <html>
            <head></head>
            <body></body>
          </html>
        `,
            { status: 200 },
          ),
        ),
    );

    const response = await app.request(
      `/api/feed-items/${feedItem.id}/${feedItem.feedId}/extract-content`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: "" });
  });

  it("should handle encoded uri component feed item id", async () => {
    const feedItem = testFixtures.loadFeedItem(db, {
      link: "https://example.com",
      id: "https://example.com",
    });

    using _ = stub(
      globalThis,
      "fetch",
      () =>
        Promise.resolve(
          new Response(
            `
          <html>
            <head></head>
            <body><p>oi</p></body>
          </html>
        `,
            { status: 200 },
          ),
        ),
    );

    const response = await app.request(
      `/api/feed-items/${
        encodeURIComponent(feedItem.id)
      }/${feedItem.feedId}/extract-content`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: '<div id="readability-page-1" class="page"><p>oi</p>\n' +
        "          \n" +
        "        </div>",
    });
  });
});
