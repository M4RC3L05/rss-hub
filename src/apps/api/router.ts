import { type Middleware, Router } from "@m4rc3l05/sss";
import bodyParser from "body-parser";
import qs from "qs";
import { jsonBodyParser, requestValidator } from "../../middlewares/mod.js";
import validator from "../../validator/mod.js";
import {
  categoriesHandlers,
  feedItemsHandlers,
  feedsHandlers,
  opmlHandlers,
} from "./handlers/mod.js";

export const router = await new Router().setup({
  querystringParser: (s: string) => qs.parse(s),
});

router.get("/api/categories", categoriesHandlers.getCategories.handler);
router.post(
  "/api/categories",
  jsonBodyParser(),
  requestValidator({
    validator,
    schemas: categoriesHandlers.createCategory.schemas,
  }),
  categoriesHandlers.createCategory.handler,
);
router.patch(
  "/api/categories/:id/name",
  jsonBodyParser(),
  requestValidator({
    validator,
    schemas: categoriesHandlers.updateCategoryName.schemas,
  }),
  categoriesHandlers.updateCategoryName.handler,
);
router.delete(
  "/api/categories/:id",
  requestValidator({
    validator,
    schemas: categoriesHandlers.deleteCatagory.schemas,
  }),
  categoriesHandlers.deleteCatagory.handler,
);

router.get(
  "/api/feeds",
  requestValidator({
    validator,
    schemas: feedsHandlers.getFeeds.schemas,
  }),
  feedsHandlers.getFeeds.handler,
);
router.post(
  "/api/feeds/url",
  jsonBodyParser(),
  requestValidator({
    validator,
    schemas: feedsHandlers.validateFeedUrl.schemas,
  }),
  feedsHandlers.validateFeedUrl.handler,
);
router.post(
  "/api/feeds",
  jsonBodyParser(),
  requestValidator({
    validator,
    schemas: feedsHandlers.createFeed.schemas,
  }),
  feedsHandlers.createFeed.handler,
);
router.patch(
  "/api/feeds/:id",
  jsonBodyParser(),
  requestValidator({
    validator,
    schemas: feedsHandlers.updateFeed.schemas,
  }),
  feedsHandlers.updateFeed.handler,
);
router.delete(
  "/api/feeds/:id",
  requestValidator({
    validator,
    schemas: feedsHandlers.deleteFeed.schemas,
  }),
  feedsHandlers.deleteFeed.handler,
);

router.get(
  "/api/feed-items",
  requestValidator({
    validator,
    schemas: feedItemsHandlers.getFeedItems.schemas,
  }),
  feedItemsHandlers.getFeedItems.handler,
);
router.patch(
  "/api/feed-items/readed",
  jsonBodyParser(),
  requestValidator({
    validator,
    schemas: feedItemsHandlers.markFeedItemsAsRead.schemas,
  }),
  feedItemsHandlers.markFeedItemsAsRead.handler,
);
router.patch(
  "/api/feed-items/unread",
  jsonBodyParser(),
  requestValidator({
    validator,
    schemas: feedItemsHandlers.markFeedItemsAsUnread.schemas,
  }),
  feedItemsHandlers.markFeedItemsAsUnread.handler,
);

router.post("/api/opml/import", opmlHandlers.importOpml.handler);
router.get("/api/opml/export", opmlHandlers.exportOpml.handler);
