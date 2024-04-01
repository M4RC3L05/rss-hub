import config from "config";
import { type ContextVariableMap, Hono } from "hono";
import { serveStatic } from "hono/deno";
import { basicAuth } from "hono/basic-auth";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { makeLogger } from "#src/common/logger/mod.ts";
import { serviceRegister } from "#src/middlewares/mod.ts";
import { router } from "./router.ts";
import type {
  CategoriesService,
  FeedItemsService,
  FeedsService,
  OpmlService,
} from "#src/apps/web/services/api/mod.ts";

const log = makeLogger("web");

declare module "hono" {
  interface ContextVariableMap {
    services: {
      api: {
        categoriesService: CategoriesService;
        opmlService: OpmlService;
        feedItemsService: FeedItemsService;
        feedsService: FeedsService;
      };
    };
  }
}

export const makeApp = (deps: Partial<ContextVariableMap>) => {
  const app = new Hono();

  app.use("*", serviceRegister(deps));
  app.use("*", secureHeaders({ referrerPolicy: "same-origin" }));
  app.use("*", async (c, next) => {
    try {
      await next();
    } finally {
      // This is important so that we always make sure the browser will not cache the previous page
      // so that the requests are always made.
      if (
        !c.req.path.startsWith("/public") &&
        !c.req.path.startsWith("/deps")
      ) {
        c.header("cache-control", "no-cache, no-store, must-revalidate");
        c.header("pragma", "no-cache");
        c.header("expires", "0");
      }
    }
  });
  app.use(
    "*",
    basicAuth({
      ...config.get<{ name: string; pass: string }>("apps.web.basicAuth"),
    }),
  );

  app.get("/favicon.ico", serveStatic({ root: "./src/apps/web/public" }));
  app.get(
    "/public/*",
    serveStatic({
      root: "./src/apps/web/public",
      rewriteRequestPath: (path) => path.replace("/public", ""),
    }),
  );

  router(app);

  app.onError((error, c) => {
    log.error("Something went wrong!", { error });

    if (error instanceof HTTPException) {
      if (error.res) {
        error.res.headers.forEach((value, key) => {
          c.header(key, value);
        });
      }
    }

    // Redirect back on request that alter the application state.
    if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
      return c.redirect(c.req.header("Referer") ?? "/");
    }

    return c.text(
      error.message ?? "Something broke",
      // deno-lint-ignore no-explicit-any
      (error as any).status ?? 500,
    );
  });

  app.notFound(() => {
    throw new HTTPException(404, { message: "Route not found" });
  });

  return app;
};
