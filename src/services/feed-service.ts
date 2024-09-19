import { createHash } from "node:crypto";
import { sql } from "@m4rc3l05/sqlite-tag";
import { Requester } from "@m4rc3l05/requester";
import * as requesterComposers from "@m4rc3l05/requester/composers";
import { resolve as feedResolver } from "@m4rc3l05/feed-normalizer";
import * as _ from "lodash-es";
import type { CustomDatabase } from "../database/mod.ts";
import type { FeedsTable } from "../database/types/mod.ts";
import { formatError, makeLogger } from "#src/common/logger/mod.ts";
import { DOMParser } from "@b-fuze/deno-dom/native";
import { dirname, join, normalize } from "@std/path";
import { xmlParser } from "#src/common/utils/xml-utils.ts";

const xmlContentTypeHeaders = [
  "application/xml",
  "application/rss+xml",
  "application/rdf+xml",
  "application/atom+xml",
  "text/xml",
  "text/html",
];

const jsonContentTypeHeaders = [
  "application/feed+json",
  "application/json",
];

const validContentTypes = [
  ...xmlContentTypeHeaders,
  ...jsonContentTypeHeaders,
];

const potencialFeedLinkFragments = [
  "/rss",
  "/rss.xml",
  "/feed",
  "/feed.xml",
  "/atom",
  "/atom.xml",
  "/json",
];

const log = makeLogger("feed-service");

const normalizeLink = (normalizedURL: URL, link: string) => {
  const domain = normalizedURL.origin;
  const normalizedPath = normalize(normalizedURL.href.replace(domain, ""));
  const normalizedLink = link.startsWith("http") ? link : normalize(link);

  return normalizedLink.startsWith("http") ? normalizedLink : new URL(
    normalizedLink.startsWith("/") ? normalizedLink : join(
      dirname(normalizedPath),
      normalizedLink,
    ),
    domain,
  ).toString();
};

class FeedService {
  #db: CustomDatabase;
  #requester: Requester;
  #domParser;

  constructor(db: CustomDatabase) {
    this.#db = db;
    this.#requester = new Requester().with(
      requesterComposers.timeout({ ms: 5000 }),
      requesterComposers.skip({ n: 1 }, requesterComposers.delay({ ms: 1000 })),
      requesterComposers.retry({
        maxRetries: 3,
        shouldRetry: ({ error }) =>
          !!error && !["AbortError"].includes(error.name),
      }),
    );
    this.#domParser = new DOMParser();
  }

  async getFeedLinks(url: string | URL, options: { signal?: AbortSignal }) {
    const normalizedURL = new URL(url);
    const pageResponse = await this.#requester.fetch(normalizedURL.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.3",
      },
      ...(options ?? {}),
    });

    if (!pageResponse.ok) {
      throw new Error("Could not fetch page", {
        cause: {
          cause: {
            response: _.pick(pageResponse, [
              "headers",
              "status",
              "statusText",
              "type",
              "url",
            ]),
          },
        },
      });
    }

    const pageText = await pageResponse.text();
    const parsedPageDom = this.#domParser.parseFromString(
      pageText,
      "text/html",
    );

    const feedLinks = Array.from(parsedPageDom.head.querySelectorAll(
      'link[type="application/rss+xml"], link[type="application/rss"], link[type="application/atom+xml"], link[type="application/atom"], link[type="application/feed+json"], link[type="application/json"]',
    ))
      .map((ele) => ele.getAttribute("href")?.trim())
      .filter((link) => typeof link === "string")
      .map((frag) => normalizeLink(normalizedURL, frag))
      .filter((url) => typeof url === "string");

    if (feedLinks.length <= 0) {
      const siteMapResponse = await fetch(
        new URL("/sitemap.xml", normalizedURL.origin),
      );

      if (!pageResponse.ok) {
        log.warn("Unable to fetch sitemap, skipping", {
          response: _.pick(pageResponse, [
            "headers",
            "status",
            "statusText",
            "type",
            "url",
          ]),
        });

        return feedLinks;
      }

      const xmlDOM = xmlParser.parse(await siteMapResponse.text());
      const links: { loc?: string }[] =
        Array.isArray(xmlDOM?.sitemapindex?.sitemap)
          ? xmlDOM?.sitemapindex?.sitemap
          : [];

      feedLinks.push(
        ...links.filter((item) =>
          typeof item.loc === "string" &&
          potencialFeedLinkFragments.some((frag) => item.loc!.includes(frag))
        )
          .filter((item) => typeof item.loc === "string")
          .map((item) => normalizeLink(normalizedURL, item.loc!))
          .filter((link) => typeof link === "string"),
      );
    }

    return feedLinks;
  }

  async syncFeed(feed: FeedsTable, options: { signal?: AbortSignal }) {
    const extracted = await this.#extractRawFeed(feed.url, options);

    if (options?.signal?.aborted) {
      throw new Error("Aborted");
    }

    const data = feedResolver(extracted);

    const status = await Promise.allSettled(
      // deno-lint-ignore require-await
      data.items.map(async (entry) => this.#syncFeedEntry(feed.id, entry)),
    );

    const totalCount = status.length;
    const successCount = status.filter(
      ({ status }) => status === "fulfilled",
    ).length;
    const faildCount = status.filter(
      ({ status }) => status === "rejected",
    ).length;
    const failedReasons = status
      .filter(({ status }) => status === "rejected")
      .map((data) => (data as PromiseRejectedResult).reason as unknown);

    return {
      totalCount,
      successCount,
      faildCount,
      failedReasons: failedReasons.map((reason) =>
        reason instanceof Error ? formatError(reason) : reason
      ),
    };
  }

  async verifyFeed(url: string, options?: { signal: AbortSignal }) {
    const rawFeed = await this.#extractRawFeed(url, options ?? {});
    const parsed = feedResolver(rawFeed);

    return parsed;
  }

  async #extractRawFeed(url: string, options: { signal?: AbortSignal }) {
    try {
      const response = await this.#requester.fetch(url, options);
      if (!response.ok) {
        throw new Error(`Request is not ok`, {
          cause: {
            response: _.pick(response, [
              "headers",
              "status",
              "statusText",
              "type",
              "url",
            ]),
          },
        });
      }

      if (response.status === 304) {
        throw new Error("Feed did not change");
      }

      if (!response.headers.has("content-type")) {
        throw new Error("No content type header in response");
      }

      const contentType = response.headers.get("content-type");

      if (!contentType) {
        throw new Error(`No content type provided for feed "${url}"`);
      }

      if (!validContentTypes.some((ct) => contentType.includes(ct))) {
        throw new Error(`Not a valid content type header of "${contentType}"`, {
          cause: {
            response: _.pick(response, [
              "headers",
              "status",
              "statusText",
              "type",
              "url",
            ]),
          },
        });
      }

      return await response.text();
    } catch (error) {
      throw new Error(`Error fetching feed ${url}`, {
        cause: error,
      });
    }
  }

  #syncFeedEntry(
    feedId: string,
    item: ReturnType<typeof feedResolver>["items"][0],
  ) {
    const toInsert = {
      id: item.id ??
        createHash("sha512").update(JSON.stringify(item)).digest("base64"),
      feedId,
      content: item.content ?? "",
      img: item.image ?? null,
      createdAt: item.createdAt?.toISOString() ??
        item.updatedAt?.toISOString() ??
        new Date().toISOString(),
      title: item.title ?? "",
      enclosure: JSON.stringify(item.enclosures),
      link: item.link ?? null,
      updatedAt: item.updatedAt?.toISOString() ??
        item.createdAt?.toISOString() ??
        new Date().toISOString(),
    };

    this.#db.execute(
      sql`
        insert into feed_items ${
        sql.insert(
          _.mapKeys(toInsert, (__: unknown, k: string) => _.snakeCase(k)),
        )
      }
        on conflict (id, feed_id)
        do update set
          content = ${
        sql.ternary(
          !!item.content,
          () => sql`${toInsert.content}`,
          () => sql.id("content"),
        )
      },
          img = ${
        sql.ternary(
          !!item.image,
          () => sql`${toInsert.img}`,
          () => sql.id("img"),
        )
      },
          title = ${item.title ? sql`${toInsert.title}` : sql.id("title")},
          enclosure = ${
        sql.ternary(
          item.enclosures.length > 0,
          () => sql`${toInsert.enclosure}`,
          () => sql.id("enclosure"),
        )
      },
          link = ${
        sql.ternary(
          !!item.link,
          () => sql`${toInsert.link}`,
          () => sql.id("link"),
        )
      },
          updated_at = ${toInsert.updatedAt}
      `,
    );
  }
}

export default FeedService;
