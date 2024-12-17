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

describe("DELETE /api/categories/:id", () => {
  it("should throw a validation error if invalid data is provided", async () => {
    const response = await app.request("/api/categories/foo", {
      method: "DELETE",
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });

    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Validation failed",
        validationErrors: [{
          message: "The id field must be a valid UUID",
          rule: "uuid",
          field: "id",
        }],
      },
    });
  });

  it("should throw 404 error if it could not find the category", async () => {
    const response = await app.request(
      `/api/categories/${crypto.randomUUID()}`,
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
        message: "Category not found",
      },
    });
  });

  it("should delete a category", async () => {
    const category = testFixtures.loadCategory(db);

    const response = await app.request(
      `/api/categories/${category.id}`,
      {
        method: "DELETE",
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.bytes();
    const items = db.sql`select id from categories`;

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(items.length, 0);
  });

  it("should delete all related data when deleting a category", async () => {
    const category = testFixtures.loadCategory(db, { name: "foo" });
    const categoryTwo = testFixtures.loadCategory(db, { name: "bar" });
    const feed = testFixtures.loadFeed(db, {
      categoryId: category.id,
      url: "foo",
    });
    const feedTwo = testFixtures.loadFeed(db, {
      categoryId: categoryTwo.id,
      url: "bar",
    });
    testFixtures.loadFeedItem(db, { feedId: feed.id });
    const feedItemTwo = testFixtures.loadFeedItem(db, { feedId: feedTwo.id });

    const response = await app.request(
      `/api/categories/${category.id}`,
      {
        method: "DELETE",
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.bytes();
    const categories = db.sql`select id from categories`;
    const feeds = db.sql`select id from feeds`;
    const feedItems = db.sql`select id from feed_items`;

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(categories.length, 1);
    assertEquals(categories[0].id, categoryTwo.id);
    assertEquals(feeds.length, 1);
    assertEquals(feeds[0].id, feedTwo.id);
    assertEquals(feedItems.length, 1);
    assertEquals(feedItems[0].id, feedItemTwo.id);
  });
});
