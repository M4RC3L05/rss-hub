import { makeApp } from "#src/apps/api/app.ts";
import { beforeAll, describe, it } from "@std/testing/bdd";
import { encodeBase64 } from "@std/encoding";
import { assertEquals } from "@std/assert";
import type { Hono } from "@hono/hono";
import { assertSpyCallArg, assertSpyCalls, spy } from "@std/testing/mock";

let app: Hono;

beforeAll(() => {
  app = makeApp({ shutdown: new AbortController().signal });
});

describe("GET /api/feeds/feed-links", () => {
  it("should throw a validation error if invalid url query data is provided", async () => {
    const response = await app.request(
      "/api/feeds/feed-links?url=foo",
      {
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

  it("should call feedService.getFeedLinks()", async () => {
    // deno-lint-ignore no-explicit-any
    const feedService = { getFeedLinks: () => Promise.resolve(["foo"]) } as any;
    using getFeedLinksSpy = spy(feedService, "getFeedLinks");

    const response = await makeApp({
      feedService,
      shutdown: new AbortController().signal,
    }).request(
      `/api/feeds/feed-links?url=${encodeURIComponent("https://example.com")}`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: ["foo"] });
    assertSpyCalls(getFeedLinksSpy, 1);
    assertSpyCallArg(getFeedLinksSpy, 0, 0, "https://example.com");
  });
});
