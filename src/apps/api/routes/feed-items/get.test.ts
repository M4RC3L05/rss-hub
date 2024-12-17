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

describe("GET /api/feed-items/:id/:feedId", () => {
  it("should throw a validation error if invalid request params data is provided", async () => {
    const response = await app.request(
      "/api/feed-items/foo/bar",
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

  it("should throw a 404 error if not feed item is found", async () => {
    const response = await app.request(
      `/api/feed-items/foo/${crypto.randomUUID()}`,
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
        message: "Could not fund feed item",
      },
    });
  });

  it("should return a feed item", async () => {
    const feetItem = testFixtures.loadFeedItem(db);

    const response = await app.request(
      `/api/feed-items/${feetItem.id}/${feetItem.feedId}`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: feetItem });
  });

  it("should handle encode uri compoenent feed item id", async () => {
    const feetItem = testFixtures.loadFeedItem(db, {
      id: "https://example.com",
    });

    const response = await app.request(
      `/api/feed-items/${encodeURIComponent(feetItem.id)}/${feetItem.feedId}`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: feetItem });
  });
});
