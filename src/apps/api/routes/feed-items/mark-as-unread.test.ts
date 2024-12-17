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

describe("PATCH /api/feed-items/unread", () => {
  it("should throw a validation error if no data is provided", async () => {
    const response = await app.request(
      "/api/feed-items/unread",
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
            field: "",
            message: "Either feedId or ids",
            rule: "feed_id_or_ids",
          },
        ],
      },
    });
  });

  it("should throw a validation error if invalid data is provided", async () => {
    {
      const response = await app.request(
        "/api/feed-items/unread",
        {
          method: "PATCH",
          body: JSON.stringify({ feedId: "", ids: 1 }),
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
              field: "ids",
              message: "The ids field must be an array",
              rule: "array",
            },
          ],
        },
      });
    }

    {
      const response = await app.request(
        "/api/feed-items/unread",
        {
          method: "PATCH",
          body: JSON.stringify({ feedId: "", ids: [] }),
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
              field: "ids",
              message: "The ids field must have at least 1 items",
              meta: {
                min: 1,
              },
              rule: "array.minLength",
            },
          ],
        },
      });
    }

    {
      const response = await app.request(
        "/api/feed-items/unread",
        {
          method: "PATCH",
          body: JSON.stringify({ feedId: "", ids: [{ id: 1, feedId: "" }] }),
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
              field: "ids.0.id",
              message: "The id field must be a string",
              rule: "string",
            },
          ],
        },
      });
    }
  });

  it("should mark as unreaded by feed id", async () => {
    const feed = testFixtures.loadFeed(db);
    const feedItem = testFixtures.loadFeedItem(db, {
      id: "foo",
      readedAt: new Date().toISOString(),
      feedId: feed.id,
    });
    const feedItem2 = testFixtures.loadFeedItem(db, {
      id: "foo2",
      readedAt: new Date().toISOString(),
      feedId: feed.id,
    });
    const feedItem3 = testFixtures.loadFeedItem(db, {
      id: "bar",
      readedAt: new Date().toISOString(),
    });

    const response = await app.request(
      "/api/feed-items/unread",
      {
        method: "PATCH",
        body: JSON.stringify({ feedId: feedItem.feedId }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.bytes();
    const feedItems = db.sql<
      { id: string; readedAt: string | null }
    >`select id, readed_at as "readedAt" from feed_items`;

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(
      feedItems.find((f) => f.id === feedItem.id)?.readedAt,
      null,
    );
    assertEquals(
      feedItems.find((f) => f.id === feedItem2.id)?.readedAt,
      null,
    );
    assertEquals(
      typeof feedItems.find((f) => f.id === feedItem3.id)?.readedAt,
      "string",
    );
  });

  it("should mark as unreaded by feed item id", async () => {
    const feedItem = testFixtures.loadFeedItem(db, {
      id: "foo",
      readedAt: new Date().toISOString(),
    });
    const feedItem2 = testFixtures.loadFeedItem(db, {
      id: "foo2",
      readedAt: new Date().toISOString(),
    });
    const feedItem3 = testFixtures.loadFeedItem(db, {
      id: "bar",
      readedAt: new Date().toISOString(),
    });

    assertEquals(typeof feedItem.readedAt, "string");
    assertEquals(typeof feedItem2.readedAt, "string");
    assertEquals(typeof feedItem3.readedAt, "string");

    const response = await app.request(
      "/api/feed-items/unread",
      {
        method: "PATCH",
        body: JSON.stringify({
          ids: [
            { id: feedItem.id, feedId: feedItem.feedId },
            { id: feedItem2.id, feedId: feedItem2.feedId },
          ],
        }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.bytes();
    const feedItems = db.sql<
      { id: string; readedAt: string | null }
    >`select id, readed_at as "readedAt" from feed_items`;

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(
      feedItems.find((f) => f.id === feedItem.id)?.readedAt,
      null,
    );
    assertEquals(
      feedItems.find((f) => f.id === feedItem2.id)?.readedAt,
      null,
    );
    assertEquals(
      typeof feedItems.find((f) => f.id === feedItem3.id)?.readedAt,
      "string",
    );
  });
});
