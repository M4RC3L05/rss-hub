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
import { assertSpyCalls, spy } from "@std/testing/mock";

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

describe("POST /api/opml/import", () => {
  it("should throw 422 if not file was submitted", async () => {
    const formData = new FormData();
    const response = await app.request("/api/opml/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Must provided a opml file",
      },
    });
  });

  it("should throw 422 if file is too big", async () => {
    const formData = new FormData();
    formData.append("file", testFixtures.maxOpmlImportPayload);

    const response = await app.request("/api/opml/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "File size must not excceed 3145728 bytes",
      },
    });
  });

  it("should handle malformed ompl file", async () => {
    const formData = new FormData();
    formData.append("file", testFixtures.opmlMalformedFileExport);

    const response = await app.request("/api/opml/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Malformed opml file",
      },
    });
  });

  it("should handle opml with no items", async () => {
    const formData = new FormData();
    formData.append("file", testFixtures.opmlEmptyFileExport);

    const response = await app.request("/api/opml/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.bytes();

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(db.sql`select * from categories`.length, 0);
    assertEquals(db.sql`select * from feeds`.length, 0);
    assertEquals(db.sql`select * from feed_items`.length, 0);
  });

  it("should handle opml with no one item", async () => {
    const formData = new FormData();
    formData.append("file", testFixtures.opmlWithOneItemsFileExport);
    const feedService = { syncFeed: () => Promise.resolve({}) };

    const syncFeedSpy = spy(feedService, "syncFeed");

    const response = await makeApp({
      database: db,
      shutdown: new AbortController().signal,
      // deno-lint-ignore no-explicit-any
      feedService: feedService as any,
    }).request("/api/opml/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.bytes();

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(db.sql`select * from categories`.length, 1);
    assertEquals(db.sql`select * from feeds`.length, 1);
    assertEquals(db.sql`select * from feed_items`.length, 0);
    assertSpyCalls(syncFeedSpy, 1);
  });

  it("should handle opml with multiple item", async () => {
    const formData = new FormData();
    formData.append("file", testFixtures.opmlWithItemsFileExport);
    const feedService = { syncFeed: () => Promise.resolve({}) };

    const syncFeedSpy = spy(feedService, "syncFeed");

    const response = await makeApp({
      database: db,
      shutdown: new AbortController().signal,
      // deno-lint-ignore no-explicit-any
      feedService: feedService as any,
    }).request("/api/opml/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.bytes();

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(db.sql`select name from categories order by name`, [
      { name: "cat:bar" },
      { name: "cat:biz" },
      { name: "cat:foo" },
    ]);
    assertEquals(db.sql`select name, url from feeds order by name`, [
      { name: "feed:bar", url: "feed:url:bar" },
      { name: "feed:biz", url: "feed:url:biz" },
      { name: "feed:foo", url: "feed:url:foo" },
    ]);
    assertEquals(db.sql`select * from feed_items`, []);
    assertSpyCalls(syncFeedSpy, 3);
  });
});
