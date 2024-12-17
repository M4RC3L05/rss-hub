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

describe("POST /api/categories", () => {
  it("should throw a validation error if no data is provided", async () => {
    const response = await app.request("/api/categories", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
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
          message: "The name field must be defined",
          rule: "required",
          field: "name",
        }],
      },
    });
  });

  it("should throw a validation error if invalid data is provided", async () => {
    const response = await app.request("/api/categories", {
      method: "POST",
      body: JSON.stringify({
        name: 1,
      }),
      headers: {
        "content-type": "application/json",
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
          message: "The name field must be a string",
          rule: "string",
          field: "name",
        }],
      },
    });
  });

  it("should create a new category", async () => {
    const response = await app.request("/api/categories", {
      method: "POST",
      body: JSON.stringify({
        name: "foo",
      }),
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });

    const data = await response.json();
    const [inserted] = db
      .sql`
        select 
          id, name, created_at as "createdAt", updated_at as "updatedAt" 
        from categories 
        where id = ${data.data.id}
        limit 1
      `;

    assertEquals(response.status, 201);
    assertEquals(data, { data: inserted });
  });
});
