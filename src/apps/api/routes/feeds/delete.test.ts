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
});

afterAll(() => {
  db.close();
});

describe("DELETE /api/feeds", () => {
  it("should throw a validation error if invallid request param data is provided", async () => {
    const response = await app.request(
      "/api/feeds/foo",
      {
        method: "DELETE",
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
            message: "The id field must be a valid UUID",
            rule: "uuid",
          },
        ],
      },
    });
  });

  it("should throw a 404 error if no feed is found", async () => {
    const response = await app.request(
      `/api/feeds/${crypto.randomUUID()}`,
      {
        method: "DELETE",
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
        message: "Could not find feed",
      },
    });
  });

  it("should delete a feed", async () => {
    const feed = testFixtures.loadFeed(db);
    testFixtures.loadFeedItem(db, { feedId: feed.id });

    const feed2 = testFixtures.loadFeed(db);
    const feed2Item = testFixtures.loadFeedItem(db, { feedId: feed2.id });

    const response = await app.request(
      `/api/feeds/${feed.id}`,
      {
        method: "DELETE",
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.bytes();

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(db.sql`select id from feeds`, [{ id: feed2.id }]);
    assertEquals(db.sql`select id, feed_id as "feedId" from feed_items`, [{
      id: feed2Item.id,
      feedId: feed2Item.feedId,
    }]);
  });
});
