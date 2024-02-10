import { Hono } from "hono";
import * as categoriesRouter from "./categories/mod.js";
import * as feedItemsRouter from "./feed-items/mod.js";
import * as feedsRouter from "./feeds/mod.js";
import * as opmlRouter from "./opml/mod.js";

export const handlersRouter = () => {
  return new Hono()
    .route("/categories", categoriesRouter.router())
    .route("/feeds", feedsRouter.router())
    .route("/feed-items", feedItemsRouter.router())
    .route("/opml", opmlRouter.router());
};
