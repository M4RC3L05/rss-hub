import http from "node:http";
import { promisify } from "node:util";
import { type AddressInfo } from "node:net";
import process from "node:process";
import { randomUUID } from "node:crypto";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import koaQs from "koa-qs";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import config from "config";
import { encodeXML } from "entities";
import basicAuth from "koa-basic-auth";
import { Busboy } from "@fastify/busboy";
import makeLogger, { destination } from "../../common/logger/mod.js";
import makeDbClient from "../../database/mod.js";
import { processUtils } from "../../common/utils/mod.js";
import { errorMapper, requestLifeCycle, requestValidator } from "../../common/middlewares/mod.js";
import * as errorMappers from "../../common/errors/mappers/mod.js";
import makeValidator from "../../common/validator/mod.js";
import { feedResolvers } from "../../common/resolvers/mod.js";
import FeedService from "../../common/services/feed-service.js";
import makeApp from "./app.js";
import makeRouter from "./router.js";
import {
  categoriesHandlers,
  feedsHandlers,
  feedItemsHandlers,
  opmlHandlers,
} from "./handlers/mod.js";

const validator = makeValidator([
  ...Object.values(categoriesHandlers.updateCategoryName.schemas.request),
  ...Object.values(categoriesHandlers.createCategory.schemas.request),
  ...Object.values(categoriesHandlers.deleteCatagory.schemas.request),
  ...Object.values(feedsHandlers.getFeeds.schemas.request),
  ...Object.values(feedsHandlers.createFeed.schemas.request),
  ...Object.values(feedsHandlers.validateFeedUrl.schemas.request),
  ...Object.values(feedsHandlers.deleteFeed.schemas.request),
  ...Object.values(feedsHandlers.updateFeed.schemas.request),
  ...Object.values(feedItemsHandlers.getFeedItems.schemas.request),
  ...Object.values(feedItemsHandlers.markFeedItemsAsRead.schemas.request),
  ...Object.values(feedItemsHandlers.markFeedItemsAsUnread.schemas.request),
]);
const xmlParser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  parseAttributeValue: true,
});
const xmlBuilder = new XMLBuilder({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
});
const db = makeDbClient({ path: config.get<string>("database.path"), randomUuid: randomUUID });
const feedService = new FeedService({
  db,
  parser: xmlParser,
  builder: xmlBuilder,
  resolvers: feedResolvers,
});
const log = makeLogger("api");
const app = makeApp({
  middlewares: {
    basicAuth: basicAuth({ ...config.get<{ name: string; pass: string }>("apps.api.basicAuth") }),
    requestLifeCycle: requestLifeCycle({ loggerFactory: makeLogger }),
    bodyParser: bodyParser(),
    cors: cors(),
    qs: koaQs,
    errorMapper: errorMapper({
      loggerFactory: makeLogger,
      mappers: [errorMappers.validationErrorMapper, errorMappers.sqliteErrorMapper],
      defaultMapper: errorMappers.defaultErrorMapper,
    }),
  },
  router: makeRouter({
    validator,
    middlewares: {
      requestValidator,
    },
    feedItemsHandlers: {
      getFeedItems: {
        schemas: feedItemsHandlers.getFeedItems.schemas,
        handler: feedItemsHandlers.getFeedItems.handler({ db }),
      },
      markFeedItemsAsRead: {
        schemas: feedItemsHandlers.markFeedItemsAsRead.schemas,
        handler: feedItemsHandlers.markFeedItemsAsRead.handler({ db }),
      },
      markFeedItemsAsUnread: {
        schemas: feedItemsHandlers.markFeedItemsAsUnread.schemas,
        handler: feedItemsHandlers.markFeedItemsAsUnread.handler({ db }),
      },
    },
    feedsHandlers: {
      getFeeds: {
        schemas: feedsHandlers.getFeeds.schemas,
        handler: feedsHandlers.getFeeds.handler({ db }),
      },
      updateFeed: {
        schemas: feedsHandlers.updateFeed.schemas,
        handler: feedsHandlers.updateFeed.handler({ db }),
      },
      deleteFeed: {
        schemas: feedsHandlers.deleteFeed.schemas,
        handler: feedsHandlers.deleteFeed.handler({ db }),
      },
      createFeed: {
        schemas: feedsHandlers.createFeed.schemas,
        handler: feedsHandlers.createFeed.handler({
          db,
          logger: makeLogger,
          feedService,
        }),
      },
      validateFeedUrl: {
        schemas: feedsHandlers.validateFeedUrl.schemas,
        handler: feedsHandlers.validateFeedUrl.handler({
          resolveTile: feedResolvers.resolveFeedItemTitle,
          feedService,
        }),
      },
    },
    categoriesHandlers: {
      deleteCatagory: {
        schemas: categoriesHandlers.deleteCatagory.schemas,
        handler: categoriesHandlers.deleteCatagory.handler({ db }),
      },
      updateCategoryName: {
        schemas: categoriesHandlers.updateCategoryName.schemas,
        handler: categoriesHandlers.updateCategoryName.handler({ db }),
      },
      getCategories: {
        handler: categoriesHandlers.getCategories.handler({ db }),
      },
      createCategory: {
        schemas: categoriesHandlers.createCategory.schemas,
        handler: categoriesHandlers.createCategory.handler({ db }),
      },
    },
    opmlHandlers: {
      importOpml: {
        handler: opmlHandlers.importOpml.handler({
          feedService,
          db,
          formDataParser: ({ headers }) =>
            new Busboy({
              headers,
              limits: { fields: 1, files: 1, fileSize: 1024 * 1024 * 10 },
            }),
          xmlParser,
          logger: makeLogger,
        }),
      },
      exportOpml: {
        handler: opmlHandlers.exportOpml.handler({ db, encodeEntitiesXml: encodeXML }),
      },
    },
  }),
});

const { port, host } = config.get<{ port: number; host: string }>("apps.api");
const server = http.createServer(app.callback());
const pClose = promisify<void>(server.close).bind(server);

server.listen(port, host, () => {
  const addr = server.address() as AddressInfo;
  log.info(`Listening on ${addr.address}:${addr.port}`);

  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});

server.addListener("close", () => {
  log.info("Server closed");
});

processUtils.addHook({
  name: "api",
  async handler() {
    db.close();

    await pClose().catch((error) => {
      log.error(error, "Could not close server");
    });

    destination.flushSync();
  },
});
