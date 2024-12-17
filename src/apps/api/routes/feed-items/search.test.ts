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

describe("GET /api/feed-items", () => {
  it("should throw a validation error if invalid query data is provided", async () => {
    const response = await app.request(
      "/api/feed-items?bookmarked=5&feedId=2&unread=3&page=foo&limit=bar",
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
          {
            field: "page",
            message: "The page field must be a number",
            rule: "number",
          },
          {
            field: "limit",
            message: "The limit field must be a number",
            rule: "number",
          },
        ],
      },
    });
  });

  it("should handle no feed items", async () => {
    const response = await app.request(
      "/api/feed-items",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: [],
      pagination: { limit: 10, next: 0, previous: 0, total: 0 },
    });
  });

  it("should filter feed items by bookmark status", async () => {
    const feedItem = testFixtures.loadFeedItem(db, {
      bookmarkedAt: new Date().toISOString(),
    });
    const feedItem2 = testFixtures.loadFeedItem(db, {
      bookmarkedAt: new Date().toISOString(),
    });
    testFixtures.loadFeedItem(db, { bookmarkedAt: null });

    const response = await app.request(
      "/api/feed-items?bookmarked=true",
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
        { ...feedItem2, totalItems: 2 },
        { ...feedItem, totalItems: 2 },
      ],
      pagination: {
        limit: 10,
        next: 0,
        previous: 0,
        total: 2,
      },
    });
  });

  it("should filter feed items by feedId", async () => {
    const feed = testFixtures.loadFeed(db);
    const feedItem = testFixtures.loadFeedItem(db, { feedId: feed.id });
    const feedItem2 = testFixtures.loadFeedItem(db, { feedId: feed.id });
    testFixtures.loadFeedItem(db);

    const response = await app.request(
      `/api/feed-items?feedId=${feed.id}`,
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
        { ...feedItem2, totalItems: 2 },
        { ...feedItem, totalItems: 2 },
      ],
      pagination: {
        limit: 10,
        next: 0,
        previous: 0,
        total: 2,
      },
    });
  });

  it("should filter feed items by unread status", async () => {
    const feedItem = testFixtures.loadFeedItem(db, { readedAt: null });
    const feedItem2 = testFixtures.loadFeedItem(db, { readedAt: null });
    testFixtures.loadFeedItem(db, { readedAt: new Date().toISOString() });

    const response = await app.request(
      "/api/feed-items?unread=true",
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
        { ...feedItem2, totalItems: 2 },
        { ...feedItem, totalItems: 2 },
      ],
      pagination: {
        limit: 10,
        next: 0,
        previous: 0,
        total: 2,
      },
    });
  });

  it("should paginate feed items", async () => {
    const feedItem = testFixtures.loadFeedItem(db);
    const feedItem2 = testFixtures.loadFeedItem(db);
    const feedItem3 = testFixtures.loadFeedItem(db);

    {
      const response = await app.request(
        "/api/feed-items?page=0&limit=2",
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
          { ...feedItem3, totalItems: 3 },
          { ...feedItem2, totalItems: 3 },
        ],
        pagination: {
          limit: 2,
          next: 1,
          previous: 0,
          total: 3,
        },
      });
    }

    {
      const response = await app.request(
        "/api/feed-items?page=1&limit=2",
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
          { ...feedItem, totalItems: 3 },
        ],
        pagination: {
          limit: 2,
          next: 1,
          previous: 0,
          total: 3,
        },
      });
    }
  });
});
