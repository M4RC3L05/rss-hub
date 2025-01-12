import config from "config";
import { type ContextVariableMap, Hono } from "@hono/hono";
import { serveStatic } from "@hono/hono/deno";
import { basicAuth } from "@hono/hono/basic-auth";
import { jsxRenderer } from "@hono/hono/jsx-renderer";
import { HTTPException } from "@hono/hono/http-exception";
import { secureHeaders } from "@hono/hono/secure-headers";
import { makeLogger } from "#src/common/logger/mod.ts";
import { serviceRegister } from "#src/middlewares/mod.ts";
import { router } from "#src/apps/web/routes/mod.ts";
import type {
  CategoriesService,
  FeedItemsService,
  FeedsService,
  OpmlService,
} from "#src/apps/web/services/api/mod.ts";
import { MainLayout } from "#src/apps/web/views/common/layouts/main.tsx";

const log = makeLogger("web");

declare module "@hono/hono" {
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

  app.use("*", serviceRegister(deps));
  app.use("*", secureHeaders({ referrerPolicy: "same-origin" }));
  app.use("*", async (c, next) => {
    try {
      await next();
      // This is important so that we always make sure the browser will not cache the previous page
      // so that the requests are always made.
      c.header("cache-control", "no-cache, no-store, must-revalidate");
      c.header("pragma", "no-cache");
      c.header("expires", "0");
    } catch (error) {
      // This is important so that we always make sure the browser will not cache the previous page
      // so that the requests are always made.
      c.header("cache-control", "no-cache, no-store, must-revalidate");
      c.header("pragma", "no-cache");
      c.header("expires", "0");

      throw error;
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

  app.get(
    "*",
    jsxRenderer(({ children }) => <MainLayout>{children}</MainLayout>, {
      docType: true,
      stream: true,
    }),
  );

  return app.route("/", router());
};
