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

describe("PATCH /api/categories/:id", () => {
  it("should throw a validation error if invalid path para provided", async () => {
    const response = await app.request(
      "/api/categories/foo",
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

  it("should throw a validation error if no data is provided", async () => {
    const response = await app.request(
      `/api/categories/${crypto.randomUUID()}`,
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
            field: "name",
            message: "The name field must be defined",
            rule: "required",
          },
        ],
      },
    });
  });

  it("should throw a validation error if invalid data is provided", async () => {
    const response = await app.request(
      `/api/categories/${crypto.randomUUID()}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name: 1 }),
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
            field: "name",
            message: "The name field must be a string",
            rule: "string",
          },
        ],
      },
    });
  });

  it("should throw a 404 error if no category exists for the provided id", async () => {
    const response = await app.request(
      `/api/categories/${crypto.randomUUID()}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name: "foo" }),
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

  it("should update a category", async () => {
    const category = testFixtures.loadCategory(db, { name: "foo" });

    assertEquals(category.name, "foo");

    const response = await app.request(
      `/api/categories/${category.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name: "bar" }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();
    const [updated] = db
      .sql`select name, updated_at as "updatedAt" from categories`;

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: { ...category, name: "bar", updatedAt: updated?.updatedAt },
    });
    assertEquals(updated?.name, "bar");
  });
});
