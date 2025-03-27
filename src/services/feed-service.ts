import { resolve as feedResolver } from "@m4rc3l05/feed-normalizer";
import pineSerializer from "pino-std-serializers";
import type { CustomDatabase, FeedsTable } from "#src/database/mod.ts";
import { makeLogger } from "#src/common/logger/mod.ts";
import { xmlUtils } from "#src/common/utils/mod.ts";
import { deadline, retry } from "@std/async";
import { encodeBase64 } from "@std/encoding";
import { pick } from "@std/collections";
import { JSDOM } from "jsdom";

const potencialFeedLinkFragments = [
  "/rss",
  "/rss/",
  "/rss.xml",
  "/feed",
  "/feed/",
  "/feed.xml",
  "/atom",
  "/atom/",
  "/atom.xml",
  "/json",
  "/json/",
];

const log = makeLogger("feed-service");

class FeedService {
  #db;

  constructor(db: CustomDatabase) {
    this.#db = db;
  }

  #fetch(
    url: string,
    options?: { signal?: AbortSignal },
  ) {
    return deadline(
      retry(() =>
        fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.3",
          },
          ...(options ?? {}),
          signal: options?.signal
            ? AbortSignal.any([options.signal, AbortSignal.timeout(10_000)])
            : AbortSignal.timeout(10_000),
        }), {
        maxAttempts: 3,
        minTimeout: 1000,
        maxTimeout: 1000,
        multiplier: 1,
        jitter: 0,
      }),
      10_000,
      { signal: options?.signal },
    );
  }

  async getFeedLinks(url: string | URL, options?: { signal?: AbortSignal }) {
    const normalizedURL = new URL(url);
    const pageResponse = await this.#fetch(normalizedURL.toString(), options);

    if (!pageResponse.ok) {
      throw new Error("Could not fetch page", {
        cause: pick(pageResponse, [
          "headers",
          "status",
          "statusText",
          "type",
          "url",
        ]),
      });
    }

    const pageText = await pageResponse.text();
    const parsedPageDom = new JSDOM(pageText).window.document;

    const feedLinks = Array.from(parsedPageDom.head.querySelectorAll(
      'link[type="application/rss+xml"], link[type="application/rss"], link[type="application/atom+xml"], link[type="application/atom"], link[type="application/feed+json"], link[type="application/json"]',
    ))
      .map((ele) => ele.getAttribute("href")?.trim())
      .filter((link) => typeof link === "string" && link.length > 0)
      .map((frag) => URL.parse(frag as string, normalizedURL)?.toString())
      .filter((url) => typeof url === "string");

    if (feedLinks.length <= 0) {
      feedLinks.push(
        ...Array.from(parsedPageDom.body.querySelectorAll("a"))
          .map((ele) => ele.getAttribute("href")?.trim())
          .filter((link) => typeof link === "string" && link.length > 0)
          .map((frag) => URL.parse(frag as string, normalizedURL)?.toString())
          .filter((url) => typeof url === "string")
          .filter((url) =>
            potencialFeedLinkFragments.some((end) => url.endsWith(end))
          ),
      );

      const siteMapResponse = await fetch(
        new URL("/sitemap.xml", normalizedURL.origin),
        {
          signal: options?.signal
            ? AbortSignal.any([options.signal, AbortSignal.timeout(10_000)])
            : AbortSignal.timeout(10_000),
        },
      );

      if (!siteMapResponse.ok) {
        log.warn("Unable to fetch sitemap, skipping", {
          response: pick(siteMapResponse, [
            "headers",
            "status",
            "statusText",
            "type",
            "url",
          ]),
        });

        return feedLinks;
      }

      const xmlDOM = xmlUtils.xmlParser.parse(await siteMapResponse.text());
      let links: { loc?: string }[] = [];

      if (xmlDOM?.sitemapindex?.sitemap) {
        links = Array.isArray(xmlDOM?.sitemapindex?.sitemap)
          ? xmlDOM?.sitemapindex?.sitemap
          : [xmlDOM?.sitemapindex?.sitemap];
      }

      if (xmlDOM?.urlset?.url) {
        links = Array.isArray(xmlDOM?.urlset?.url)
          ? xmlDOM?.urlset?.url
          : [xmlDOM?.urlset?.url];
      }

      feedLinks.push(
        ...links.filter((item) =>
          typeof item.loc === "string" &&
          potencialFeedLinkFragments.some((frag) => item.loc!.includes(frag))
        )
          .filter((item) => typeof item.loc === "string")
          .map((item) => URL.parse(item.loc!, normalizedURL.origin))
          .map((url) => url?.toString().trim())
          .filter((link) => typeof link === "string"),
      );
    }

    return feedLinks;
  }

  async syncFeed(feed: FeedsTable, options?: { signal?: AbortSignal }) {
    const extracted = await this.#extractRawFeed(feed.url, options);

    if (!extracted) {
      log.info("No content extracted, ignoring", { feed });

      return {
        totalCount: 0,
        successCount: 0,
        faildCount: 0,
        failedReasons: [],
      };
    }

    const data = feedResolver(extracted);

    const status = await Promise.allSettled(
      data.items.map((entry) => this.#syncFeedEntry(feed.id, entry)),
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
        reason instanceof Error ? pineSerializer.errWithCause(reason) : reason
      ),
    };
  }

  async verifyFeed(url: string, options?: { signal: AbortSignal }) {
    const rawFeed = await this.#extractRawFeed(url, options);
    const parsed = feedResolver(rawFeed!);

    return parsed;
  }

  async #extractRawFeed(url: string, options?: { signal?: AbortSignal }) {
    const response = await this.#fetch(url, options);

    if (response.status === 304) {
      return;
    }

    if (!response.ok) {
      throw new Error(`Could not fetch feed contents from ${url}`, {
        cause: pick(response, [
          "headers",
          "status",
          "statusText",
          "type",
          "url",
        ]),
      });
    }

    return await response.text().catch((error) => {
      throw new Error(`Unable to extract text content ${url}`, {
        cause: error,
      });
    });
  }

  async #syncFeedEntry(
    feedId: string,
    item: ReturnType<typeof feedResolver>["items"][0],
  ) {
    const toInsert = {
      id: item.id ??
        encodeBase64(
          await crypto.subtle.digest(
            "SHA-512",
            new TextEncoder().encode(JSON.stringify(item)),
          ),
        ),
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

    this.#db.sql`
      insert into feed_items
        (id, feed_id, content, img, title, enclosure, link, created_at, updated_at)
      values
        (
          ${toInsert.id},
          ${toInsert.feedId},
          ${toInsert.content},
          ${toInsert.img},
          ${toInsert.title},
          ${toInsert.enclosure},
          ${toInsert.link},
          ${toInsert.createdAt},
          ${toInsert.updatedAt}
        )
      on conflict (id, feed_id)
        do update
          set
            content = coalesce(${toInsert.content}, content),
            img = coalesce(${toInsert.img}, img),
            title = coalesce(${toInsert.title}, title),
            enclosure = coalesce(${toInsert.enclosure}, enclosure),
            link = coalesce(${toInsert.link}, link),
            updated_at = coalesce(${toInsert.updatedAt}, updated_at)
    `;
  }
}

export default FeedService;
