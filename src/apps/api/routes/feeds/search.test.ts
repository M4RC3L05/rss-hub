import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
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

describe("GET /api/feeds", () => {
  it("should handle no feeds", async () => {
    const response = await app.request(
      "/api/feeds",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: [] });
  });

  it("should get all feeds ordered by name", async () => {
    const feed = testFixtures.loadFeed(db, { name: "foo" });
    const feed2 = testFixtures.loadFeed(db, { name: "bar" });

    const response = await app.request(
      "/api/feeds",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: [
        { ...feed2, unreadCount: 0, bookmarkedCount: 0 },
        { ...feed, unreadCount: 0, bookmarkedCount: 0 },
      ],
    });
  });

  it("should get feeds with the count of unread feed items", async () => {
    const feed = testFixtures.loadFeed(db, { name: "foo" });
    testFixtures.loadFeedItem(db, { feedId: feed.id, readedAt: null });
    testFixtures.loadFeedItem(db, { feedId: feed.id, readedAt: null });
    testFixtures.loadFeedItem(db, {
      feedId: feed.id,
      readedAt: new Date().toISOString(),
    });
    const feed2 = testFixtures.loadFeed(db, { name: "bar" });

    const response = await app.request(
      "/api/feeds",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: [
        { ...feed2, unreadCount: 0, bookmarkedCount: 0 },
        { ...feed, unreadCount: 2, bookmarkedCount: 0 },
      ],
    });
  });

  it("should get feeds with the count of bookmarked feed items", async () => {
    const feed = testFixtures.loadFeed(db, { name: "foo" });
    testFixtures.loadFeedItem(db, {
      feedId: feed.id,
      bookmarkedAt: new Date().toISOString(),
      readedAt: new Date().toISOString(),
    });
    testFixtures.loadFeedItem(db, {
      feedId: feed.id,
      bookmarkedAt: new Date().toISOString(),
      readedAt: new Date().toISOString(),
    });
    testFixtures.loadFeedItem(db, {
      feedId: feed.id,
      bookmarkedAt: null,
      readedAt: new Date().toISOString(),
    });
    const feed2 = testFixtures.loadFeed(db, { name: "bar" });

    const response = await app.request(
      "/api/feeds",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: [
        { ...feed2, unreadCount: 0, bookmarkedCount: 0 },
        { ...feed, unreadCount: 0, bookmarkedCount: 2 },
      ],
    });
  });
});
