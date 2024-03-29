import { sql } from "@m4rc3l05/sqlite-tag";
import { decodeXML } from "entities";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { castArray, get } from "lodash-es";
import { stdSerializers } from "pino";
import { makeLogger } from "#src/common/logger/mod.js";
import { xmlParser } from "#src/common/utils/xml-utils.js";
import type { FeedsTable } from "#src/database/types/mod.js";

const log = makeLogger("opml-import-handler");

const handler = (router: Hono) => {
  return router.post("/import", async (c) => {
    const { file } = await c.req.parseBody();

    if (!file || !(file instanceof File)) {
      throw new HTTPException(422, { message: "Must provided a opml file" });
    }

    if (file.size > 1024 * 1024 * 3) {
      throw new HTTPException(422, {
        message: `File size must not excceed ${1024 * 1024 * 3} bytes`,
      });
    }

    const parsed = (await xmlParser.parse(await file.text())) as Record<
      string,
      unknown
    >;
    const feedsToSync: string[] = [];

    c.get("database").transaction(() => {
      const categories = castArray(get(parsed, "opml.body.outline")).filter(
        (value) => value !== null && value !== undefined,
      );

      for (const category of categories) {
        const categoryName = get(category as { "@_text": string }, "@_text");
        let categoryStored = c
          .get("database")
          .get(
            sql`select * from categories where name = ${categoryName} limit 1`,
          );

        if (!categoryStored) {
          categoryStored = c
            .get("database")
            .get(
              sql`insert into categories (name) values (${categoryName}) returning *`,
            );
        }

        const feeds = castArray(
          get(category as { outline: unknown }, "outline"),
        ).filter((value) => value !== null && value !== undefined);

        for (const feed of feeds) {
          const feedName = decodeXML(
            get(feed as { "@_text": string }, "@_text"),
          );
          const feedUrl = decodeXML(
            get(feed as { "@_xmlUrl": string }, "@_xmlUrl") ??
              get(feed as { "@_htmlUrl": string }, "@_htmlUrl"),
          );

          const feedStored = c
            .get("database")
            .get(sql`select * from feeds where url = ${feedUrl} limit 1`);

          if (!feedStored) {
            const feed = c.get("database").get<FeedsTable>(
              sql`
                insert into feeds
                  (name, url, category_id)
                values
                  (${feedName}, ${feedUrl}, ${
                    (categoryStored as { id: string }).id
                  })
                returning *
              `,
            );

            if (feed) {
              feedsToSync.push(feed.id);
            }
          }
        }
      }
    })();

    // Deferred sync inserted feeds if any
    if (feedsToSync.length > 0) {
      (async () => {
        log.info({ feedsToSync }, "Begin full feed sync");

        const feeds = c
          .get("database")
          .all<FeedsTable>(sql`select * from feeds where id in ${feedsToSync}`);

        await Promise.allSettled(
          feeds.map(async (feed: FeedsTable) => ({
            feed,
            stats: await c.get("feedService").syncFeed(feed, {
              signal: c.get("shutdownManager").abortSignal,
            }),
          })),
        )
          .then((data) => {
            log.info(
              {
                data: data.map((e) =>
                  e.status === "rejected"
                    ? e.reason instanceof Error
                      ? stdSerializers.err(e.reason)
                      : e.reason
                    : e.value,
                ),
              },
              "Full feed sync completed",
            );
          })
          .catch((error: unknown) => {
            log.error(error, "Full feed sync error");
          });
      })();
    }

    return c.body(null, 204);
  });
};

export default handler;
