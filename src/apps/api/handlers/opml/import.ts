import { type IncomingMessage } from "node:http";
import type Router from "@koa/router";
import sql, { type Database } from "@leafac/sqlite";
import createHttpError from "http-errors";
import { type Busboy, type BusboyFileStream, type BusboyHeaders } from "@fastify/busboy";
import { type XMLParser } from "fast-xml-parser";
import { castArray, get } from "lodash-es";
import type FeedService from "../../../../common/services/feed-service.js";
import { type FeedsTable } from "../../../../database/types/mod.js";
import type makeLogger from "../../../../common/logger/mod.js";

type ImportOpmlDeps = {
  db: Database;
  formDataParser: ({ headers }: { headers: BusboyHeaders }) => Busboy;
  xmlParser: XMLParser;
  feedService: FeedService;
  logger: typeof makeLogger;
};

const getFileAsync = async (parser: Busboy, request: IncomingMessage) =>
  new Promise<
    Map<string, { content: string; filename: string; encoding: string; mimetype: string }>
  >((resolve) => {
    const files = new Map<
      string,
      { content: string; filename: string; encoding: string; mimetype: string }
    >();

    // eslint-disable-next-line max-params
    parser.on("file", (fieldname, file, filename, encoding, mimetype) => {
      let content = "";

      file.on("data", (data) => {
        content += String(data);
      });
      file.on("end", () => {
        files.set(fieldname, { content, encoding, filename, mimetype });
      });
    });

    parser.on("finish", () => {
      resolve(files);
    });

    request.pipe(parser);
  });

export const handler = (deps: ImportOpmlDeps): Router.Middleware => {
  const log = deps.logger("opml-import");

  return async (ctx: Router.RouterContext) => {
    const files = await getFileAsync(
      deps.formDataParser({
        headers: ctx.headers as any as BusboyHeaders,
      }),
      ctx.req,
    );

    const file = files.get("opml");

    if (!file) {
      throw createHttpError(422, "No ompl file provided");
    }

    if (file.content.length <= 0) {
      throw createHttpError(422, "Opml file is empty");
    }

    const parsed = (await deps.xmlParser.parse(file.content)) as Record<string, unknown>;
    const feedsToSync: string[] = [];

    deps.db.executeTransaction(() => {
      for (const category of castArray(get(parsed, "opml.body.outline"))) {
        const categoryName = get(category as { "@_text": string }, "@_text");
        let categoryStored = deps.db.get(
          sql`select * from categories where name = ${categoryName} limit 1`,
        );

        if (!categoryStored) {
          categoryStored = deps.db.get(
            sql`insert into categories (name) values (${categoryName}) returning *`,
          );
        }

        for (const feed of castArray(get(category as { outline: unknown }, "outline"))) {
          const feedName = get(feed as { "@_text": string }, "@_text");
          const feedUrl =
            get(feed as { "@_xmlUrl": string }, "@_xmlUrl") ??
            get(feed as { "@_htmlUrl": string }, "@_htmlUrl");

          const feedStored = deps.db.get(
            sql`select * from feeds where name = ${feedName} and url = ${feedUrl} limit 1`,
          );

          if (!feedStored) {
            const feed = deps.db.get<FeedsTable>(
              sql`
                insert into feeds
                  (name, url, category_id)
                values
                  (${feedName}, ${feedUrl}, ${(categoryStored as { id: string }).id})
                returning *
              `,
            );

            if (feed) {
              feedsToSync.push(feed.id);
            }
          }
        }
      }
    });

    // Defered sync inserted feeds if any
    if (feedsToSync.length > 0) {
      (async () => {
        log.info({ feedsToSync }, "Begin full feed sync");

        const feeds = deps.db.all<FeedsTable>(sql`select * from feeds where id in ${feedsToSync}`);
        await Promise.allSettled(
          feeds.map(async (feed) => ({
            feed,
            stats: await deps.feedService.syncFeed(feed).catch((error: unknown) => error),
          })),
        )
          .then((data) => {
            log.info({ data }, "Full feed sync completed");
          })
          .catch((error) => {
            log.error(error, "Full feed sync error");
          });
      })();
    }

    ctx.status = 204;
  };
};
