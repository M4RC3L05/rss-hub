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
import { assertEquals, assertNotEquals } from "@std/assert";
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

describe("PATCH /api/feeds/:id", () => {
  it("should throw a validation error if invalid params data provided", async () => {
    const response = await app.request(
      "/api/feeds/foo",
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
            message: "The id field must be a valid UUID",
            rule: "uuid",
          },
        ],
      },
    });
  });

  it("should throw a validation error if invalid data provided", async () => {
    const response = await app.request(
      `/api/feeds/${crypto.randomUUID()}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: 1,
          url: "foo",
          categoryId: "bar",
        }),
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
        validationErrors: [{
          field: "name",
          message: "The name field must be a string",
          rule: "string",
        }, {
          field: "url",
          message: "The url field must be a valid URL",
          rule: "url",
        }, {
          field: "categoryId",
          message: "The categoryId field must be a valid UUID",
          rule: "uuid",
        }],
      },
    });
  });

  it("should throw a 404 error if no feed is found", async () => {
    const response = await app.request(
      `/api/feeds/${crypto.randomUUID()}`,
      {
        method: "PATCH",
        body: JSON.stringify({}),
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

  it("should update a feed", async () => {
    const category = testFixtures.loadCategory(db);
    const category2 = testFixtures.loadCategory(db);
    const feed = testFixtures.loadFeed(db, {
      name: "foo",
      url: "bar",
      categoryId: category.id,
    });

    assertEquals(feed.name, "foo");
    assertEquals(feed.url, "bar");
    assertEquals(feed.categoryId, category.id);

    const response = await app.request(
      `/api/feeds/${feed.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: "foo!",
          categoryId: category2.id,
        }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();
    const [updated] = db
      .sql`select name, category_id as "categoryId", updated_at as "updatedAt" from feeds`;

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: { ...feed, name: "foo!", categoryId: category2.id },
    });
    assertEquals(updated.name, "foo!");
    assertEquals(updated.categoryId, category2.id);
    assertNotEquals(updated.updatedAt, feed.updatedAt);
  });
});
