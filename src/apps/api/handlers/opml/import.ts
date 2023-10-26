import { type IncomingMessage } from "node:http";
import sql from "@leafac/sqlite";
import createHttpError from "http-errors";
import { Busboy, type BusboyHeaders } from "@fastify/busboy";
import { castArray, compact, get } from "lodash-es";
import { type RouteMiddleware } from "@m4rc3l05/sss";
import { decodeXML } from "entities";
import { type FeedsTable } from "../../../../database/types/mod.js";
import { makeLogger } from "../../../../common/logger/mod.js";
import { xmlParser } from "../../../../common/utils/xml-utils.js";
import { db } from "../../../../database/mod.js";
import { feedService } from "../../../../services/mod.js";

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

const formDataParser = ({ headers }: { headers: BusboyHeaders }) =>
  new Busboy({
    headers,
    limits: { fields: 1, files: 1, fileSize: 1024 * 1024 * 10 },
  });

const log = makeLogger("opml-import-handler");

export const handler: RouteMiddleware = async (request, response) => {
  const files = await getFileAsync(
    formDataParser({
      headers: request.headers as any as BusboyHeaders,
    }),
    request,
  );

  const file = files.get("opml");

  if (!file) {
    throw createHttpError(422, "No ompl file provided");
  }

  if (file.content.length <= 0) {
    throw createHttpError(422, "Opml file is empty");
  }

  const parsed = (await xmlParser.parse(file.content)) as Record<string, unknown>;
  const feedsToSync: string[] = [];

  db.executeTransaction(() => {
    for (const category of castArray(get(parsed, "opml.body.outline"))) {
      const categoryName = get(category as { "@_text": string }, "@_text");
      let categoryStored = db.get(
        sql`select * from categories where name = ${categoryName} limit 1`,
      );

      if (!categoryStored) {
        categoryStored = db.get(
          sql`insert into categories (name) values (${categoryName}) returning *`,
        );
      }

      for (const feed of compact(castArray(get(category as { outline: unknown }, "outline")))) {
        const feedName = decodeXML(get(feed as { "@_text": string }, "@_text"));
        const feedUrl = decodeXML(
          get(feed as { "@_xmlUrl": string }, "@_xmlUrl") ??
            get(feed as { "@_htmlUrl": string }, "@_htmlUrl"),
        );

        const feedStored = db.get(
          sql`select * from feeds where name is ${feedName} and url = ${feedUrl} limit 1`,
        );

        if (!feedStored) {
          const feed = db.get<FeedsTable>(
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

      const feeds = db.all<FeedsTable>(sql`select * from feeds where id in ${feedsToSync}`);
      await Promise.allSettled(
        feeds.map(async (feed) => ({
          feed,
          stats: await feedService.syncFeed(feed).catch((error: unknown) => error),
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

  response.statusCode = 204;
  response.end();
};
