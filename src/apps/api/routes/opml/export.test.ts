import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { FakeTime } from "@std/testing/time";
import { encodeBase64 } from "@std/encoding";
import { assertEquals } from "@std/assert";
import type { Hono } from "@hono/hono";
import { testDbUtils } from "#src/common/utils/mod.ts";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
import { assertSnapshot } from "@std/testing/snapshot";

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

describe("GET /api/opml/export", () => {
  it("should handle nothing to export", async (t) => {
    using _ = new FakeTime(0);
    const response = await app.request(
      "/api/opml/export",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.text();

    assertEquals(response.headers.get("content-type"), "text/x-opml");
    assertEquals(
      response.headers.get("content-disposition"),
      'attachment; filename="feeds.opml"',
    );
    assertEquals(response.status, 200);
    await assertSnapshot(t, data);
  });

  it("should export to a opml file", async (t) => {
    const category = testFixtures.loadCategory(db, { name: "cat:foo" });
    const category2 = testFixtures.loadCategory(db, { name: "cat:bar" });
    testFixtures.loadCategory(db, { name: "cat:biz" });

    const feed = testFixtures.loadFeed(db, {
      name: "feed:foo",
      categoryId: category.id,
      url: "feed:url:foo",
    });
    const feed2 = testFixtures.loadFeed(db, {
      name: "feed:bar",
      categoryId: category.id,
      url: "feed:url:bar",
    });
    testFixtures.loadFeed(db, {
      name: "feed:biz",
      categoryId: category2.id,
      url: "feed:url:biz",
    });
    testFixtures.loadFeedItem(db, { feedId: feed.id });
    testFixtures.loadFeedItem(db, { feedId: feed.id });
    testFixtures.loadFeedItem(db, { feedId: feed2.id });

    using _ = new FakeTime(0);
    const response = await app.request(
      "/api/opml/export",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.text();

    assertEquals(response.headers.get("content-type"), "text/x-opml");
    assertEquals(
      response.headers.get("content-disposition"),
      'attachment; filename="feeds.opml"',
    );
    assertEquals(response.status, 200);
    await assertSnapshot(t, data);
  });
});
