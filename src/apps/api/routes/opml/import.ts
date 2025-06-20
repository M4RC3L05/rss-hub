import { unescape } from "@std/html";
import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import { makeLogger } from "#src/common/logger/mod.ts";
import type { FeedsTable } from "#src/database/types/mod.ts";
import { xmlUtils } from "#src/common/utils/mod.ts";
import jsonMask from "json-mask";

const log = makeLogger("opml-import-handler");

export const importFeeds = (router: Hono) => {
  router.post("/import", async (c) => {
    const { file } = await c.req.parseBody();

    if (!file || !(file instanceof File)) {
      throw new HTTPException(422, { message: "Must provided a opml file" });
    }

    if (file.size > 1024 * 1024 * 3) {
      throw new HTTPException(422, {
        message: `File size must not excceed ${1024 * 1024 * 3} bytes`,
      });
    }

    const fileContent = await file.text();
    let parsed: {
      opml?: {
        body?: {
          outline?: {
            "@_text"?: string;
            outline?: {
              "@_text"?: string;
              "@_xmlUrl"?: string;
              "@_htmlUrl"?: string;
            } | {
              "@_text"?: string;
              "@_xmlUrl"?: string;
              "@_htmlUrl"?: string;
            }[];
          } | {
            "@_text"?: string;
            outline?: {
              "@_text"?: string;
              "@_xmlUrl"?: string;
              "@_htmlUrl"?: string;
            } | {
              "@_text"?: string;
              "@_xmlUrl"?: string;
              "@_htmlUrl"?: string;
            }[];
          }[];
        };
      };
    } | null;

    try {
      parsed = await xmlUtils.xmlParser.parse(fileContent);
      parsed = jsonMask(
        parsed,
        "opml(body(outline(@_text,outline(@_text,@_xmlUrl,@_htmlUrl))))",
      );

      if (!parsed) throw new Error("No parsed data");
    } catch (error) {
      throw new HTTPException(422, {
        message: "Malformed opml file",
        cause: error,
      });
    }

    const feedsToSync: string[] = [];
    const categories = (
      Array.isArray(parsed?.opml?.body?.outline)
        ? parsed.opml.body.outline
        : [parsed?.opml?.body?.outline]
    ).filter((item) => item !== null && item !== undefined);

    c.get("database").transaction(() => {
      for (const category of categories) {
        const categoryName = category["@_text"];

        if (!categoryName) {
          continue;
        }

        let [categoryStored] = c
          .get("database")
          .sql<
          { id: string }
        >`select id from categories where name = ${categoryName} limit 1`;

        if (!categoryStored) {
          categoryStored = c
            .get("database")
            .sql<
            { id: string }
          >`insert into categories (name) values (${categoryName}) returning id`[
            0
          ]!;
        }

        const feeds = (
          Array.isArray(category.outline)
            ? category.outline
            : [category.outline]
        ).filter((item) => item !== null && item !== undefined);

        for (const feed of feeds) {
          const feedName = feed["@_text"];
          const feedUrl = feed["@_xmlUrl"] ?? feed["@_htmlUrl"];

          if (!feedName || !feedUrl) {
            continue;
          }

          const [feedStored] = c
            .get("database")
            .sql`select * from feeds where url = ${unescape(feedUrl)} limit 1`;

          if (!feedStored) {
            const [feed] = c.get("database").sql<{ id: string }>`
                insert into feeds
                  (name, url, category_id)
                values
                  (
                    ${unescape(feedName)},
                    ${unescape(feedUrl)},
                    ${(categoryStored as { id: string }).id}
                  )
                returning id
              `;

            if (feed) {
              feedsToSync.push(feed.id);
            }
          }
        }
      }
    }).immediate();

    // Deferred sync inserted feeds if any
    if (feedsToSync.length > 0) {
      (async () => {
        log.info("Begin full feed sync", { feedsToSync });

        const feeds = feedsToSync.map((id) =>
          c
            .get("database")
            .sql<FeedsTable>`
            select
              id, name, url,
              category_id as "categoryId",
              created_at as "createdAt",
              updated_at as "updatedAt"
            from feeds
            where id = ${id}
          `[0]
        ).filter((item) => item !== undefined);

        await Promise.allSettled(
          feeds.map(async (feed: FeedsTable) => {
            return {
              feed,
              stats: await c.get("feedService").syncFeed(feed, {
                signal: c.get("shutdown"),
              }),
            };
          }),
        )
          .then((data) => {
            log.info("Full feed sync completed", {
              data: data.map((e) =>
                e.status === "rejected" ? e.reason : e.value
              ),
            });
          })
          .catch((error: unknown) => {
            log.error(error, "Full feed sync error");
          });
      })();
    }

    return c.body(null, 204);
  });
};
