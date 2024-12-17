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
import { assertSpyCallArg, assertSpyCalls, spy } from "@std/testing/mock";

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

describe("POST /api/feeds", () => {
  it("should throw a validation error if no data is provided", async () => {
    const response = await app.request(
      "/api/feeds",
      {
        method: "POST",
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
          {
            field: "url",
            message: "The url field must be defined",
            rule: "required",
          },
          {
            field: "categoryId",
            message: "The categoryId field must be defined",
            rule: "required",
          },
        ],
      },
    });
  });

  it("should throw a validation error if invalid data is provided", async () => {
    const response = await app.request(
      "/api/feeds",
      {
        method: "POST",
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
        validationErrors: [
          {
            field: "name",
            message: "The name field must be a string",
            rule: "string",
          },
          {
            field: "url",
            message: "The url field must be a valid URL",
            rule: "url",
          },
          {
            field: "categoryId",
            message: "The categoryId field must be a valid UUID",
            rule: "uuid",
          },
        ],
      },
    });
  });

  it.only("should create a new feed", async () => {
    const category = testFixtures.loadCategory(db);
    const feedService = {
      syncFeed: () =>
        Promise.resolve({
          faildCount: 0,
          failedReasons: [],
          successCount: 1,
          totalCount: 1,
        }),
      // deno-lint-ignore no-explicit-any
    } as any;

    using syncFeedStub = spy(feedService, "syncFeed");
    const response = await makeApp({
      database: db,
      feedService,
      shutdown: new AbortController().signal,
    })
      .request(
        "/api/feeds",
        {
          method: "POST",
          body: JSON.stringify({
            name: "foo",
            url: "https://example.com",
            categoryId: category.id,
          }),
          headers: {
            "authorization": `Basic ${encodeBase64("foo:bar")}`,
          },
        },
      );

    const data = await response.json();
    const feed = db.sql`
      select 
        id, name, url,
        category_id as "categoryId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from feeds
    `[0];

    assertEquals(response.status, 201);
    assertEquals(data, { data: feed });
    assertSpyCalls(syncFeedStub, 1);
    assertSpyCallArg(syncFeedStub, 0, 0, feed);
  });
});
