import Router from "@koa/router";
import requestValidator from "../../middlewares/request-validator.js";
import validator from "../../validator/mod.js";
import {
  categoriesHandlers,
  feedItemsHandlers,
  feedsHandlers,
  opmlHandlers,
} from "./handlers/mod.js";

export const router = new Router({ prefix: "/api" });

router.post(
  "/categories",
  requestValidator({
    validator,
    schemas: categoriesHandlers.createCategory.schemas,
  }),
  categoriesHandlers.createCategory.handler,
);
router.get("/categories", categoriesHandlers.getCategories.handler);
router.patch(
  "/categories/:id/name",
  requestValidator({
    validator,
    schemas: categoriesHandlers.updateCategoryName.schemas,
  }),
  categoriesHandlers.updateCategoryName.handler,
);
router.delete(
  "/categories/:id",
  requestValidator({
    validator,
    schemas: categoriesHandlers.deleteCatagory.schemas,
  }),
  categoriesHandlers.deleteCatagory.handler,
);

router.get(
  "/feeds",
  requestValidator({
    validator,
    schemas: feedsHandlers.getFeeds.schemas,
  }),
  feedsHandlers.getFeeds.handler,
);
router.post(
  "/feeds/url",
  requestValidator({
    validator,
    schemas: feedsHandlers.validateFeedUrl.schemas,
  }),
  feedsHandlers.validateFeedUrl.handler,
);
router.post(
  "/feeds",
  requestValidator({
    validator,
    schemas: feedsHandlers.createFeed.schemas,
  }),
  feedsHandlers.createFeed.handler,
);
router.delete(
  "/feeds/:id",
  requestValidator({
    validator,
    schemas: feedsHandlers.deleteFeed.schemas,
  }),
  feedsHandlers.deleteFeed.handler,
);
router.patch(
  "/feeds/:id",
  requestValidator({
    validator,
    schemas: feedsHandlers.updateFeed.schemas,
  }),
  feedsHandlers.updateFeed.handler,
);

router.get(
  "/feed-items",
  requestValidator({
    validator,
    schemas: feedItemsHandlers.getFeedItems.schemas,
  }),
  feedItemsHandlers.getFeedItems.handler,
);
router.patch(
  "/feed-items/readed",
  requestValidator({
    validator,
    schemas: feedItemsHandlers.markFeedItemsAsRead.schemas,
  }),
  feedItemsHandlers.markFeedItemsAsRead.handler,
);
router.patch(
  "/feed-items/unread",
  requestValidator({
    validator,
    schemas: feedItemsHandlers.markFeedItemsAsUnread.schemas,
  }),
  feedItemsHandlers.markFeedItemsAsUnread.handler,
);

router.post("/opml/import", opmlHandlers.importOpml.handler);
router.get("/opml/export", opmlHandlers.exportOpml.handler);
