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
});

afterAll(() => {
  db.close();
});

describe("GET /api/categories/:id", () => {
  it("should throw a validation error if invalid data is provided", async () => {
    const response = await app.request("/api/categories/foo", {
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

  it("should throw a 404 error if no category is found", async () => {
    const response = await app.request(
      `/api/categories/${crypto.randomUUID()}`,
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
        message: "Could not find category",
      },
    });
  });

  it("should get a category by id", async () => {
    const category = testFixtures.loadCategory(db);

    const response = await app.request(
      `/api/categories/${category.id}`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: category });
  });
});
