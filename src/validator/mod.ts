import { categoriesHandlers, feedItemsHandlers, feedsHandlers } from "../apps/api/handlers/mod.js";
import makeValidator from "../common/validator/mod.js";

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

export default validator;
