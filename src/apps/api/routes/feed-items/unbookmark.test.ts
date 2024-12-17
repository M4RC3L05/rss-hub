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

  app = makeApp({ database: db });
});

beforeEach(() => {
  db.exec("delete from categories");
  db.exec("delete from feeds");
  db.exec("delete from feed_items");
});

afterAll(() => {
  db.close();
});

describe("PATCH /api/feed-items/unbookmark", () => {
  it("should throw a validation error if no data is provided", async () => {
    const response = await app.request(
      "/api/feed-items/unbookmark",
      {
        method: "PATCH",
        body: JSON.stringify({}),
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
            field: "id",
            message: "The id field must be defined",
            rule: "required",
          },
          {
            field: "feedId",
            message: "The feedId field must be defined",
            rule: "required",
          },
        ],
      },
    });
  });

  it("should throw a validation error if invalid data is provided", async () => {
    const response = await app.request(
      "/api/feed-items/unbookmark",
      {
        method: "PATCH",
        body: JSON.stringify({ id: 1, feedId: "foo" }),
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
            field: "id",
            message: "The id field must be a string",
            rule: "string",
          },
          {
            field: "feedId",
            message: "The feedId field must be a valid UUID",
            rule: "uuid",
          },
        ],
      },
    });
  });

  it("should not throw an error if no feedItem was found", async () => {
    const response = await app.request(
      "/api/feed-items/unbookmark",
      {
        method: "PATCH",
        body: JSON.stringify({ id: "foo", feedId: crypto.randomUUID() }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.bytes();

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
  });

  it("should unbookmark a feedItem", async () => {
    const feedItem = testFixtures.loadFeedItem(db, {
      bookmarkedAt: new Date().toISOString(),
    });

    assertEquals(typeof feedItem.bookmarkedAt, "string");

    const response = await app.request(
      "/api/feed-items/unbookmark",
      {
        method: "PATCH",
        body: JSON.stringify({ id: feedItem.id, feedId: feedItem.feedId }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.bytes();
    const [updated] = db
      .sql`select bookmarked_at as "bookmarkedAt" from feed_items where id = ${feedItem.id} and feed_id = ${feedItem.feedId}`;

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(updated.bookmarkedAt, null);
  });

  it("should not throw error on unbookmarking an unbookmarked feedItem", async () => {
    const feedItem = testFixtures.loadFeedItem(db, { bookmarkedAt: null });

    assertEquals(feedItem.bookmarkedAt, null);

    const response = await app.request(
      "/api/feed-items/unbookmark",
      {
        method: "PATCH",
        body: JSON.stringify({ id: feedItem.id, feedId: feedItem.feedId }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.bytes();
    const [updated] = db
      .sql`select bookmarked_at as "bookmarkedAt" from feed_items where id = ${feedItem.id} and feed_id = ${feedItem.feedId}`;

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(updated.bookmarkedAt, null);
    assertEquals(feedItem.bookmarkedAt, updated.bookmarkedAt);
  });
});
