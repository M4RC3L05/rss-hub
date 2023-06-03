import Router, { type RouterContext } from "@koa/router";
import type Ajv from "ajv";
import type requestValidator from "../../common/middlewares/request-validator.js";
import type * as handlers from "./handlers/mod.js";

type Map<Type> = {
  [Key in keyof Type]: Omit<Type[Key], "handler"> & { handler: Router.Middleware };
};

type MakeRouterDeps = {
  validator: Ajv.default;
  categoriesHandlers: Map<(typeof handlers)["categoriesHandlers"]>;
  feedsHandlers: Map<(typeof handlers)["feedsHandlers"]>;
  feedItemsHandlers: Map<(typeof handlers)["feedItemsHandlers"]>;
  opmlHandlers: Map<(typeof handlers)["opmlHandlers"]>;
  middlewares: {
    requestValidator: typeof requestValidator;
  };
};

const makeRouter = (deps: MakeRouterDeps) => {
  const router = new Router({ prefix: "/api" });

  router.post(
    "/categories",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.categoriesHandlers.createCategory.schemas,
    }),
    deps.categoriesHandlers.createCategory.handler,
  );
  router.get("/categories", deps.categoriesHandlers.getCategories.handler);
  router.patch(
    "/categories/:id/name",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.categoriesHandlers.updateCategoryName.schemas,
    }),
    deps.categoriesHandlers.updateCategoryName.handler,
  );
  router.delete(
    "/categories/:id",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.categoriesHandlers.deleteCatagory.schemas,
    }),
    deps.categoriesHandlers.deleteCatagory.handler,
  );

  router.get(
    "/feeds",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.feedsHandlers.getFeeds.schemas,
    }),
    deps.feedsHandlers.getFeeds.handler,
  );
  router.post(
    "/feeds/url",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.feedsHandlers.validateFeedUrl.schemas,
    }),
    deps.feedsHandlers.validateFeedUrl.handler,
  );
  router.post(
    "/feeds",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.feedsHandlers.createFeed.schemas,
    }),
    deps.feedsHandlers.createFeed.handler,
  );
  router.delete(
    "/feeds/:id",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.feedsHandlers.deleteFeed.schemas,
    }),
    deps.feedsHandlers.deleteFeed.handler,
  );
  router.patch(
    "/feeds/:id",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.feedsHandlers.updateFeed.schemas,
    }),
    deps.feedsHandlers.updateFeed.handler,
  );

  router.get(
    "/feed-items",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.feedItemsHandlers.getFeedItems.schemas,
    }),
    deps.feedItemsHandlers.getFeedItems.handler,
  );
  router.patch(
    "/feed-items/readed",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.feedItemsHandlers.markFeedItemsAsRead.schemas,
    }),
    deps.feedItemsHandlers.markFeedItemsAsRead.handler,
  );
  router.patch(
    "/feed-items/unread",
    deps.middlewares.requestValidator({
      validator: deps.validator,
      schemas: deps.feedItemsHandlers.markFeedItemsAsUnread.schemas,
    }),
    deps.feedItemsHandlers.markFeedItemsAsUnread.handler,
  );

  router.post("/opml/import", deps.opmlHandlers.importOpml.handler);
  router.get("/opml/export", deps.opmlHandlers.exportOpml.handler);

  return router;
};

export default makeRouter;
