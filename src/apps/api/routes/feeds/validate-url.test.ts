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

describe("POST /api/feeds/url", () => {
  it("should throw a validation error if no data provided", async () => {
    const response = await app.request(
      "/api/feeds/url",
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
            field: "url",
            message: "The url field must be defined",
            rule: "required",
          },
        ],
      },
    });
  });

  it("should throw a validation error if invalid data provided", async () => {
    const response = await app.request(
      "/api/feeds/url",
      {
        method: "POST",
        body: JSON.stringify({ url: "foo" }),
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
            field: "url",
            message: "The url field must be a valid URL",
            rule: "url",
          },
        ],
      },
    });
  });

  it("should throw a 409 error if url already exists in a stored feed", async () => {
    testFixtures.loadFeed(db, { url: "https://example.com/" });

    const response = await app.request(
      "/api/feeds/url",
      {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 409);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Feed url already exists",
      },
    });
  });

  it("should throw a 422 error if feedService.verifyFeed() fails", async () => {
    const feedService = { verifyFeed: () => Promise.reject(new Error("foo")) };

    using verifyFeedSpy = spy(feedService, "verifyFeed");

    const response = await makeApp({
      database: db,
      shutdown: new AbortController().signal,
      // deno-lint-ignore no-explicit-any
      feedService: feedService as any,
    }).request(
      "/api/feeds/url",
      {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
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
        message: "Invalid feed url",
      },
    });
    assertSpyCalls(verifyFeedSpy, 1);
    assertSpyCallArg(verifyFeedSpy, 0, 0, "https://example.com");
  });

  it("should throw a 422 error if feedService.verifyFeed() returns no title", async () => {
    const feedService = { verifyFeed: () => Promise.resolve({}) };

    using verifyFeedSpy = spy(feedService, "verifyFeed");

    const response = await makeApp({
      database: db,
      shutdown: new AbortController().signal,
      // deno-lint-ignore no-explicit-any
      feedService: feedService as any,
    }).request(
      "/api/feeds/url",
      {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
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
        message: "No title for feed",
      },
    });
    assertSpyCalls(verifyFeedSpy, 1);
    assertSpyCallArg(verifyFeedSpy, 0, 0, "https://example.com");
  });

  it("should return feed url title", async () => {
    const feedService = { verifyFeed: () => Promise.resolve({ title: "foo" }) };

    using verifyFeedSpy = spy(feedService, "verifyFeed");

    const response = await makeApp({
      database: db,
      shutdown: new AbortController().signal,
      // deno-lint-ignore no-explicit-any
      feedService: feedService as any,
    }).request(
      "/api/feeds/url",
      {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: { title: "foo" } });
    assertSpyCalls(verifyFeedSpy, 1);
    assertSpyCallArg(verifyFeedSpy, 0, 0, "https://example.com");
  });
});
