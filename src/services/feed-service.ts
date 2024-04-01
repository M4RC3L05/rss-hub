import { createHash } from "node:crypto";
import { sql } from "@m4rc3l05/sqlite-tag";
import * as entities from "@std/html";
import * as _ from "lodash-es";
import { request } from "#src/common/utils/fetch-utils.ts";
import { xmlBuilder, xmlParser } from "#src/common/utils/xml-utils.ts";
import type { CustomDatabase } from "../database/mod.ts";
import type { FeedsTable } from "../database/types/mod.ts";
import { feedResolvers } from "#src/resolvers/mod.ts";

class FeedService {
  #db: CustomDatabase;

  constructor(db: CustomDatabase) {
    this.#db = db;
  }

  async syncFeed(feed: FeedsTable, options: { signal?: AbortSignal }) {
    let data: Record<string, unknown> | undefined;

    try {
      const extracted = await this.#extractRawFeed(feed.url, options);
      data = this.toObject(extracted);
    } catch (error) {
      throw new Error(`Could not get/parse feed "${feed.url}"`, {
        cause: error,
      });
    }

    if (options?.signal?.aborted) {
      throw new Error("Aborted");
    }

    const feedPage = feedResolvers.resolveFeed(data);

    if (!feedPage) {
      throw new Error(`Could not get feed for feed ${feed.url}`, {
        cause: data,
      });
    }

    if (options?.signal?.aborted) {
      throw new Error("Aborted");
    }

    const feedItems = feedResolvers.resolveFeedItems(feedPage);

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
      feedItems.map(async (entry) => this.#syncFeedEntry(entry, feed.id)),
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

  toObject(data: string): Record<string, unknown> {
    return xmlParser.parse(data) as Record<string, unknown>;
  }

  async verifyFeed(url: string, options?: { signal: AbortSignal }) {
    const rawFeed = await this.#extractRawFeed(
      url,
      options as Omit<typeof options, "database">,
    );
    const parsed = this.toObject(rawFeed);

    if (!feedResolvers.resolveFeed(parsed)) {
      throw new Error(`No feed found in url ${url}`);
    }

    return parsed;
  }

  getFeedTitle(raw: Record<string, unknown>) {
    const feed = feedResolvers.resolveFeed(raw);

    if (!feed) {
      throw new Error("Could not get feed title.");
    }

    return feedResolvers.resolveFeedTitle(feed);
  }

  async #extractRawFeed(url: string, options: { signal?: AbortSignal }) {
    try {
      const response = await request(url, options, { maxRetries: 1 });

      if (!response.ok) {
        throw new Error(`Error fetching feed ${url}`, {
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

      if (!response.headers.has("content-type")) {
        throw new Error("No content type header in response");
      }

      const contentType = response.headers.get("content-type");
      const validContentTypes = [
        "application/xml",
        "application/rss+xml",
        "application/rdf+xml",
        "application/atom+xml",
        "text/xml",
        "text/html",
      ];

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

  #syncFeedEntry(feedItem: Record<string, unknown>, feedId: string) {
    const id = feedResolvers.resolveFeedItemGuid(feedItem);
    const enclosures = feedResolvers.resolveFeedItemEnclosures(feedItem);
    let feedImage = feedResolvers.resolveFeedItemImage(
      (feed) => feedResolvers.resolveFeedItemContent(xmlBuilder, feed),
      feedItem,
    );
    const content = feedResolvers.formatFeedItemContent(
      feedResolvers.resolveFeedItemContent(xmlBuilder, feedItem),
    );
    const pubDate = feedResolvers.resolveFeedItemPubDate(feedItem);
    const updatedAt = feedResolvers.resolveUpdatedAt(feedItem);
    const link = feedResolvers.resolveFeedItemLink(feedItem);
    const title = feedResolvers.resolveFeedItemTitle(feedItem);

    if (feedImage) {
      feedImage = entities.unescape(feedImage);
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
