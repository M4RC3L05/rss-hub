import Router from "@koa/router";
import requestValidator from "../../middlewares/request-validator.js";
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
    schemas: categoriesHandlers.createCategory.schemas,
  }),
  categoriesHandlers.createCategory.handler,
);
router.get("/categories", categoriesHandlers.getCategories.handler);
router.patch(
  "/categories/:id/name",
  requestValidator({
    schemas: categoriesHandlers.updateCategoryName.schemas,
  }),
  categoriesHandlers.updateCategoryName.handler,
);
router.delete(
  "/categories/:id",
  requestValidator({
    schemas: categoriesHandlers.deleteCatagory.schemas,
  }),
  categoriesHandlers.deleteCatagory.handler,
);

router.get(
  "/feeds",
  requestValidator({
    schemas: feedsHandlers.getFeeds.schemas,
  }),
  feedsHandlers.getFeeds.handler,
);
router.post(
  "/feeds/url",
  requestValidator({
    schemas: feedsHandlers.validateFeedUrl.schemas,
  }),
  feedsHandlers.validateFeedUrl.handler,
);
router.post(
  "/feeds",
  requestValidator({
    schemas: feedsHandlers.createFeed.schemas,
  }),
  feedsHandlers.createFeed.handler,
);
router.delete(
  "/feeds/:id",
  requestValidator({
    schemas: feedsHandlers.deleteFeed.schemas,
  }),
  feedsHandlers.deleteFeed.handler,
);
router.patch(
  "/feeds/:id",
  requestValidator({
    schemas: feedsHandlers.updateFeed.schemas,
  }),
  feedsHandlers.updateFeed.handler,
);

router.get(
  "/feed-items",
  requestValidator({
    schemas: feedItemsHandlers.getFeedItems.schemas,
  }),
  feedItemsHandlers.getFeedItems.handler,
);
router.patch(
  "/feed-items/readed",
  requestValidator({
    schemas: feedItemsHandlers.markFeedItemsAsRead.schemas,
  }),
  feedItemsHandlers.markFeedItemsAsRead.handler,
);
router.patch(
  "/feed-items/unread",
  requestValidator({
    schemas: feedItemsHandlers.markFeedItemsAsUnread.schemas,
  }),
  feedItemsHandlers.markFeedItemsAsUnread.handler,
);

router.post("/opml/import", opmlHandlers.importOpml.handler);
router.get("/opml/export", opmlHandlers.exportOpml.handler);
