import { createHash } from "node:crypto";
import { sql } from "@m4rc3l05/sqlite-tag";
import { Requester } from "@m4rc3l05/requester";
import * as requesterComposers from "@m4rc3l05/requester/composers";
import { resolve as feedResolver } from "@m4rc3l05/feed-normalizer";
import * as _ from "lodash-es";
import type { CustomDatabase } from "../database/mod.ts";
import type { FeedsTable } from "../database/types/mod.ts";
import { formatError } from "#src/common/logger/mod.ts";

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
      raw: JSON.stringify(item),
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
