import { createHash } from "node:crypto";
import { type Kysely, type Selectable } from "kysely";
import { type DB, type Feeds } from "kysely-codegen";
import * as _ from "lodash-es";
import { type XMLBuilder, type XMLParser } from "fast-xml-parser";
import { type feedResolvers } from "../resolvers/mod.js";

type FeedServiceDeps = {
  db: Kysely<DB>;
  parser: XMLParser;
  builder: XMLBuilder;
  resolvers: typeof feedResolvers;
};

class FeedService {
  #db;
  #parser: XMLParser;
  #builder: XMLBuilder;
  #resolvers: typeof feedResolvers;

  constructor({ db, parser, builder, resolvers }: FeedServiceDeps) {
    this.#db = db;
    this.#parser = parser;
    this.#builder = builder;
    this.#resolvers = resolvers;
  }

  async syncFeed(feed: Selectable<Feeds>, options?: { signal: AbortSignal }) {
    let data;

    try {
      data = await this.#extractRawFeed(feed.url, options);
      data = this.toObject(data);
    } catch (error) {
      throw new Error(`Could not get/parse feed "${feed.url}"`, { cause: error });
    }

    if (options?.signal?.aborted) {
      throw new Error("Aborted");
    }

    const feedPage = this.#resolvers.resolveFeed(data);

    if (!feedPage) {
      throw new Error(`Could not get feed for feed ${feed.url}`, { cause: data });
    }

    if (options?.signal?.aborted) {
      throw new Error("Aborted");
    }

    const feedItems = this.#resolvers.resolveFeedItems(feedPage);

    if (!feedItems) {
      throw new Error(`No feed items for feed "${feed.url}"`, { cause: feedPage });
    }

    if (options?.signal?.aborted) {
      throw new Error("Aborted");
    }

    const status = await Promise.allSettled(
      feedItems.map(async (entry) => this.#syncFeedEntry(entry, feed.id)),
    );
    const totalCount = status.length;
    const successCount = status.filter(({ status }) => status === "fulfilled").length;
    const faildCount = status.filter(({ status }) => status === "rejected").length;
    const failedReasons = status
      .filter(({ status }) => status === "rejected")
      .map((data) => (data as PromiseRejectedResult).reason as unknown);

    return { totalCount, successCount, faildCount, failedReasons };
  }

  toObject(data: string): Record<string, unknown> {
    return this.#parser.parse(data) as Record<string, unknown>;
  }

  async verifyFeed(url: string, options?: { signal: AbortSignal }) {
    return this.#extractRawFeed(url, options);
  }

  getFeedTitle(data: string) {
    const parsed = this.toObject(data);
    const feed = this.#resolvers.resolveFeed(parsed);

    if (!feed) return undefined;

    return this.#resolvers.resolveFeedTitle(feed);
  }

  async #extractRawFeed(url: string, options?: { signal: AbortSignal }) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Error fetching feed ${url}`, {
          cause: { response: _.pick(response, ["headers", "status", "statusText", "type", "url"]) },
        });
      }

      if (!response.headers.has("content-type")) {
        throw new Error("No content type header in repsonse");
      }

      const contentType = response.headers.get("content-type")!;
      const validContentTypes = [
        "application/xml",
        "application/rss+xml",
        "application/rdf+xml",
        "application/atom+xml",
        "text/xml",
        "text/html",
      ];

      if (!validContentTypes.some((ct) => contentType.includes(ct))) {
        throw new Error(
          `Not a valid content type header of ${response.headers.get("content-type") ?? ""}`,
          {
            cause: {
              response: _.pick(response, ["headers", "status", "statusText", "type", "url"]),
            },
          },
        );
      }

      return await response.text();
    } catch (error) {
      throw new Error(`Error fetching feed ${url}`, {
        cause: error,
      });
    }
  }

  async #syncFeedEntry(feedItem: Record<string, unknown>, feedId: string) {
    const id = this.#resolvers.resolveGuid(feedItem);
    const enclosures = this.#resolvers.resolveEnclosures(feedItem);
    const feedImage = this.#resolvers.resolveFeedItemImage(
      (feed) => this.#resolvers.resolveContent(this.#builder, feed),
      feedItem,
    );
    const content = this.#resolvers.formatContent(
      this.#resolvers.resolveContent(this.#builder, feedItem),
    );
    const pubDate = this.#resolvers.resolvePubDate(feedItem);
    const link = this.#resolvers.resolveLink(feedItem);
    const title = this.#resolvers.resolveTitle(feedItem);

    await this.#db
      .insertInto("feedItems")
      .values({
        id: id ?? createHash("sha512").update(JSON.stringify(feedItem)).digest("base64"),
        feedId,
        raw: JSON.stringify(feedItem),
        content: content ?? "",
        img: feedImage ?? null,
        createdAt: new Date(pubDate ?? new Date()).toISOString(),
        title: title ?? "",
        enclosure: JSON.stringify(enclosures),
        link: link ?? null,
        updatedAt: new Date(pubDate ?? new Date()).toISOString(),
      })
      .onConflict((c) =>
        c.columns(["id", "feedId"]).doUpdateSet((eb) => ({
          raw: JSON.stringify(feedItem),
          content: content ?? eb.ref("content"),
          img: feedImage ?? eb.ref("img"),
          title: title ?? eb.ref("title"),
          enclosure: enclosures.length > 0 ? JSON.stringify(enclosures) : eb.ref("enclosure"),
          link: link ?? eb.ref("link"),
          updatedAt: new Date(pubDate ?? new Date()).toISOString(),
        })),
      )
      .execute();
  }
}

export default FeedService;
