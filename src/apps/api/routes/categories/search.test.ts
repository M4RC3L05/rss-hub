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
});

afterAll(() => {
  db.close();
});

describe("GET /api/categories", () => {
  it("should handle no categories", async () => {
    const response = await app.request(
      "/api/categories",
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

  it("should get all categories ordered by name with its feed count", async () => {
    const category = testFixtures.loadCategory(db, { name: "foo" });
    const categoryTwo = testFixtures.loadCategory(db, { name: "bar" });
    testFixtures.loadFeed(db, { categoryId: categoryTwo.id });

    const response = await app.request(
      "/api/categories",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: [{ ...categoryTwo, feedCount: 1 }, { ...category, feedCount: 0 }],
    });
  });
});
