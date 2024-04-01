import { Hono } from "hono";
import * as categoriesRouter from "./categories/mod.ts";
import * as feedItemsRouter from "./feed-items/mod.ts";
import * as feedsRouter from "./feeds/mod.ts";
import * as opmlRouter from "./opml/mod.ts";

export const handlersRouter = () => {
	return new Hono()
		.route("/categories", categoriesRouter.router())
		.route("/feeds", feedsRouter.router())
		.route("/feed-items", feedItemsRouter.router())
		.route("/opml", opmlRouter.router());
};
