import { createHash } from "node:crypto";
import { sql } from "@m4rc3l05/sqlite-tag";
import * as entities from "@std/html";
import { Requester } from "@m4rc3l05/requester";
import * as requesterComposers from "@m4rc3l05/requester/composers";
import * as _ from "lodash-es";
import type { CustomDatabase } from "../database/mod.ts";
import type { FeedsTable } from "../database/types/mod.ts";
import {
  type FeedResolver,
  jsonFeedResolver,
  xmlFeedResolver,
} from "#src/resolvers/mod.ts";

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

const resolveFeedResolver = (contentType: string): FeedResolver => {
  if (xmlContentTypeHeaders.some((ct) => contentType.includes(ct))) {
    return xmlFeedResolver;
  }

  if (jsonContentTypeHeaders.some((ct) => contentType.includes(ct))) {
    return jsonFeedResolver;
  }

  throw new Error(`No feed resolver for content type "${contentType}"`);
};

class FeedService {
  #db: CustomDatabase;
  #requester: Requester;

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
  }

  async syncFeed(feed: FeedsTable, options: { signal?: AbortSignal }) {
    let data: Record<string, unknown> | undefined;
    let feedResolver: FeedResolver;

    try {
      const { data: extracted, feedResolver: fr } = await this.#extractRawFeed(
        feed.url,
        options,
      );
      data = fr.toObject(extracted);
      feedResolver = fr;
    } catch (error) {
      throw new Error(`Could not get/parse feed "${feed.url}"`, {
        cause: error,
      });
    }

    if (options?.signal?.aborted) {
      throw new Error("Aborted");
    }

    const feedPage = feedResolver.resolveFeed(data!);

    if (!feedPage) {
      throw new Error(`Could not get feed for feed ${feed.url}`, {
        cause: data,
      });
    }

    if (options?.signal?.aborted) {
      throw new Error("Aborted");
    }

    const feedItems = feedResolver.resolveFeedItems(feedPage);

    if (!feedItems) {
      throw new Error(`No feed items for feed "${feed.url}"`, {
        cause: feedPage,
      });
    }

    if (options?.signal?.aborted) {
      throw new Error("Aborted");
    }

    const status = await Promise.allSettled(
      // deno-lint-ignore require-await
      feedItems.map(async (entry) =>
        this.#syncFeedEntry(feedPage, entry, feedResolver, feed.id)
      ),
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

    return { totalCount, successCount, faildCount, failedReasons };
  }

  async verifyFeed(url: string, options?: { signal: AbortSignal }) {
    const { data: rawFeed, feedResolver } = await this.#extractRawFeed(
      url,
      options ?? {},
    );
    const parsed = feedResolver.toObject(rawFeed);
    const feed = feedResolver.resolveFeed(parsed!);

    if (!feed) {
      throw new Error(`No feed found in url ${url}`);
    }

    return { feed, feedResolver };
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

      return {
        data: await response.text(),
        feedResolver: resolveFeedResolver(contentType),
      };
    } catch (error) {
      throw new Error(`Error fetching feed ${url}`, {
        cause: error,
      });
    }
  }

  #syncFeedEntry(
    feed: Record<string, unknown>,
    feedItem: Record<string, unknown>,
    feedResolver: FeedResolver,
    feedId: string,
  ) {
    const homePageUrl = feedResolver.resolveHomePageUrl(feed);
    const id = feedResolver.resolveFeedItemGuid(feedItem);
    const enclosures = feedResolver.resolveFeedItemEnclosures(feedItem);
    let feedImage = feedResolver.resolveFeedItemImage(feedItem);
    let content = feedResolver.resolveFeedItemContent(feedItem);
    const pubDate = feedResolver.resolveFeedItemPubDate(feedItem);
    const updatedAt = feedResolver.resolveUpdatedAt(feedItem);
    const link = feedResolver.resolveFeedItemLink(feedItem);
    const title = feedResolver.resolveFeedItemTitle(feedItem);

    if (feedImage) {
      feedImage = entities.unescape(feedImage);
    }

    if (
      typeof feedImage === "string" && !feedImage?.trim()?.startsWith("http") &&
      typeof homePageUrl === "string" && homePageUrl.trim().startsWith("http")
    ) {
      feedImage = new URL(feedImage, homePageUrl).toString();
    }

    if (typeof content === "string") {
      const r = /<img[^>]+src="([^"]+)"/img;
      content = content.replaceAll(r, (str, url) => {
        if (url.startsWith("http") || typeof homePageUrl !== "string") {
          return str;
        }

        return str.replace(url, new URL(url, homePageUrl).toString());
      });
    }

    const toInsert = {
      id: id ??
        createHash("sha512").update(JSON.stringify(feedItem)).digest("base64"),
      feedId,
      raw: JSON.stringify(feedItem),
      content: content ?? "",
      img: feedImage ?? null,
      createdAt: pubDate?.toISOString() ??
        updatedAt?.toISOString() ??
        new Date().toISOString(),
      title: title ?? "",
      enclosure: JSON.stringify(enclosures),
      link: link ?? null,
      updatedAt: updatedAt?.toISOString() ??
        pubDate?.toISOString() ??
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
          !!content,
          () => sql`${toInsert.content}`,
          () => sql.id("content"),
        )
      },
          img = ${
        sql.ternary(
          !!feedImage,
          () => sql`${toInsert.img}`,
          () => sql.id("img"),
        )
      },
          title = ${title ? sql`${toInsert.title}` : sql.id("title")},
          enclosure = ${
        sql.ternary(
          enclosures.length > 0,
          () => sql`${toInsert.enclosure}`,
          () => sql.id("enclosure"),
        )
      },
          link = ${
        sql.ternary(
          !!link,
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
