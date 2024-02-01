import { createHash } from "node:crypto";
import sql from "@leafac/sqlite";
import * as entities from "entities";
import * as _ from "lodash-es";
import { request } from "../common/utils/fetch-utils.js";
import { xmlBuilder, xmlParser } from "../common/utils/xml-utils.js";
import { type CustomDatabase } from "../database/mod.js";
import { type FeedsTable } from "../database/types/mod.js";
import { feedResolvers } from "../resolvers/mod.js";

export class FeedService {
  async syncFeed(
    feed: FeedsTable,
    options: { signal?: AbortSignal; database: CustomDatabase },
  ) {
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
      feedItems.map(async (entry) =>
        this.#syncFeedEntry(entry, feed.id, options?.database),
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
      const response = await request(url, options, { retryN: 1 });

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

  async #syncFeedEntry(
    feedItem: Record<string, unknown>,
    feedId: string,
    datababse: CustomDatabase,
  ) {
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
      feedImage = entities.decodeXML(feedImage);
    }

    const toInsert = {
      id:
        id ??
        createHash("sha512").update(JSON.stringify(feedItem)).digest("base64"),
      feedId,
      raw: JSON.stringify(feedItem),
      content: content ?? "",
      img: feedImage ?? null,
      createdAt:
        pubDate?.toISOString() ??
        updatedAt?.toISOString() ??
        new Date().toISOString(),
      title: title ?? "",
      enclosure: JSON.stringify(enclosures),
      link: link ?? null,
      updatedAt:
        updatedAt?.toISOString() ??
        pubDate?.toISOString() ??
        new Date().toISOString(),
    };

    datababse.run(
      sql`
        insert into
          feed_items(id, feed_id, raw, content, img, created_at, title, enclosure, link, updated_at)
        values
          (${toInsert.id}, ${toInsert.feedId}, ${toInsert.raw}, ${
            toInsert.content
          }, ${toInsert.img}, ${toInsert.createdAt}, ${toInsert.title}, ${
            toInsert.enclosure
          }, ${toInsert.link}, ${toInsert.updatedAt})
        on conflict
          (id, feed_id)
        do update set
          content = $${content ? sql`${toInsert.content}` : sql`content`},
          img = $${feedImage ? sql`${toInsert.img}` : sql`img`},
          title = $${title ? sql`${toInsert.title}` : sql`title`},
          enclosure = $${
            enclosures.length > 0 ? sql`${toInsert.enclosure}` : sql`enclosure`
          },
          link = $${link ? sql`${toInsert.link}` : sql`link`},
          updated_at = ${toInsert.updatedAt}
      `,
    );
  }
}

export const feedService = new FeedService();
