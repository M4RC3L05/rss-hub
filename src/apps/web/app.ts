import { Readable } from "node:stream";
import { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import config from "config";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { secureHeaders } from "hono/secure-headers";
import { stream } from "hono/streaming";
import fetch from "node-fetch";
import { requestLifeCycle } from "#src/middlewares/mod.js";
import {
  categoriesViews,
  feedItemsViews,
  feedsViews,
  opmlViews,
} from "./views/mod.js";

const basicAuthInfo = {
  username: config.get<{ name: string; pass: string }>("apps.web.basicAuth")
    .name,
  password: config.get<{ name: string; pass: string }>("apps.web.basicAuth")
    .pass,
};
// const apiDomain = "http://127.0.0.1:4321";
const apiDomain = "http://rss-hub-api.rss-hub.svc.cluster.local:4321";

const replaceAndReloadLink = (url: string) =>
  `javascript:replaceAndReload("${url}")`;

const makeApp = () => {
  const app = new Hono<{ Bindings: HttpBindings }>();

  // app.get("/stall", async (c) => {
  //   await setTimeout(400000, undefined, { signal: c.req.raw.signal });
  //   return c.text("foo");
  // });

  app.use("*", requestLifeCycle);
  app.use("*", secureHeaders());
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
  app.use("*", basicAuth(basicAuthInfo));

  app.get("/favicon.ico", serveStatic({ root: "./src/apps/web/public" }));
  app.get(
    "/public/*",
    serveStatic({
      root: "./src/apps/web/public",
      rewriteRequestPath: (path) => path.replace("/public", ""),
    }),
  );
  app.route(
    "/deps",
    new Hono()
      .get(
        "/simpledotcss/*",
        serveStatic({
          root: "./node_modules/simpledotcss",
          rewriteRequestPath: (path) => path.replace("/deps/simpledotcss", ""),
        }),
      )
      .get(
        "/htmx.org/*",
        serveStatic({
          root: "./node_modules/htmx.org",
          rewriteRequestPath: (path) => path.replace("/deps/htmx.org", ""),
        }),
      ),
  );

  app.get("/", async (c) => {
    const [{ data: categories }, { data: feeds }] = await Promise.all([
      fetch(`${apiDomain}/api/categories`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${basicAuthInfo.username}:${basicAuthInfo.password}`,
          ).toString("base64")}`,
        },
      }).then((response) => response.json()),
      fetch(`${apiDomain}/api/feeds`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${basicAuthInfo.username}:${basicAuthInfo.password}`,
          ).toString("base64")}`,
        },
      }).then((response) => response.json()),
    ]);

    return c.html(feedsViews.pages.Index({ categories, feeds }));
  });
  app.get("/feeds/create", async (c) => {
    const { data: categories } = await fetch(`${apiDomain}/api/categories`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${basicAuthInfo.username}:${basicAuthInfo.password}`,
        ).toString("base64")}`,
      },
    }).then((response) => response.json());

    return c.html(feedsViews.pages.Create({ categories }));
  });
  app.post("/feeds/create", async (c) => {
    const data = await c.req.parseBody();

    await fetch(`${apiDomain}/api/feeds`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${basicAuthInfo.username}:${basicAuthInfo.password}`,
        ).toString("base64")}`,
        "content-type": "application/json",
      },
      method: "post",
      body: JSON.stringify(data),
    }).then((response) => {
      if (response.status >= 400) throw new Error("Could not create feed");
    });

    return c.text("ok");
  });
  app.get("/feeds/edit", async (c) => {
    const feedId = c.req.query("feedId");

    const [{ data: categories }, { data: feed }] = await Promise.all([
      fetch(`${apiDomain}/api/categories`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${basicAuthInfo.username}:${basicAuthInfo.password}`,
          ).toString("base64")}`,
        },
      }).then((response) => response.json()),
      fetch(`${apiDomain}/api/feeds/${feedId}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${basicAuthInfo.username}:${basicAuthInfo.password}`,
          ).toString("base64")}`,
        },
      }).then((response) => response.json()),
    ]);

    return c.html(feedsViews.pages.Edit({ categories, feed }));
  });
  app.post("/feeds/edit", async (c) => {
    const { id, ...data } = await c.req.parseBody();

    await fetch(`${apiDomain}/api/feeds/${id}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${basicAuthInfo.username}:${basicAuthInfo.password}`,
        ).toString("base64")}`,
        "content-type": "application/json",
      },
      method: "patch",
      body: JSON.stringify(data),
    }).then((response) => {
      if (response.status >= 400) throw new Error("Could not create feed");

      return response.json();
    });

    return c.text("ok");
  });
  app.post("/feeds/delete", async (c) => {
    const data = await c.req.parseBody();

    await fetch(`${apiDomain}/api/feeds/${data.id}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${basicAuthInfo.username}:${basicAuthInfo.password}`,
        ).toString("base64")}`,
      },
      method: "delete",
    }).then((response) => {
      if (response.status >= 400) throw new Error("Could not delete feed");
    });

    return c.text("ok");
  });
  app.get("/feeds/verify-url", async (c) => {
    const url = c.req.query("url");

    c.req.raw.signal.addEventListener("abort", () => {
      console.log("req aborted");
    });

    const { data } = await fetch(`${apiDomain}/api/feeds/url`, {
      signal: c.req.raw.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${basicAuthInfo.username}:${basicAuthInfo.password}`,
        ).toString("base64")}`,
        "content-type": "application/json",
      },
      method: "post",
      body: JSON.stringify({ url }),
    }).then((response) => {
      if (response.status >= 400) throw new Error("Could not create category");

      return response.json();
    });

    return c.text(data.title);
  });

  app.get("/feed-items", async (c) => {
    const feedId = c.req.query("feedId");
    const unread = c.req.query("unread");
    const bookmarked = c.req.query("bookmarked");
    const limit = c.req.query("limit");
    const page = c.req.query("page");

    const [
      { data: feed },
      { data: feedItems, pagination: feedItemsPagination },
    ] = await Promise.all([
      fetch(`${apiDomain}/api/feeds/${feedId}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${basicAuthInfo.username}:${basicAuthInfo.password}`,
          ).toString("base64")}`,
        },
      }).then((response) => response.json()),
      fetch(
        `${apiDomain}/api/feed-items?feedId=${feedId}${
          unread ? "&unread=true" : ""
        }${bookmarked ? "&bookmarked=true" : ""}${page ? `&page=${page}` : ""}${
          limit ? `&limit=${limit}` : ""
        }`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${basicAuthInfo.username}:${basicAuthInfo.password}`,
            ).toString("base64")}`,
          },
        },
      ).then((response) => response.json()),
    ]);

    const previousLink = `/feed-items?feedId=${feedId}${
      unread ? "&unread=true" : ""
    }${bookmarked ? "&bookmarked=true" : ""}&page=${
      feedItemsPagination.previous
    }${limit ? `&limit=${limit}` : ""}`;
    const nextLink = `/feed-items?feedId=${feedId}${
      unread ? "&unread=true" : ""
    }${bookmarked ? "&bookmarked=true" : ""}&page=${feedItemsPagination.next}${
      limit ? `&limit=${limit}` : ""
    }`;

    const currUrl = new URL(c.req.url);

    return c.html(
      feedItemsViews.pages.Index({
        feed,
        feedItems,
        filters: {
          unreaded: {
            state: !!unread,
            onLink: replaceAndReloadLink(
              `${currUrl.pathname}${`${currUrl.search.replaceAll(
                "&unread=true",
                "",
              )}&unread=true`}`,
            ),
            offLink: replaceAndReloadLink(
              `${currUrl.pathname}${currUrl.search.replaceAll(
                "&unread=true",
                "",
              )}`,
            ),
          },
          bookmarked: {
            state: !!bookmarked,
            onLink: replaceAndReloadLink(
              `${currUrl.pathname}${`${currUrl.search.replaceAll(
                "&bookmarked=true",
                "",
              )}&bookmarked=true`}`,
            ),
            offLink: replaceAndReloadLink(
              `${currUrl.pathname}${currUrl.search.replaceAll(
                "&bookmarked=true",
                "",
              )}`,
            ),
          },
        },
        feedItemsPagination: {
          startLink: replaceAndReloadLink(
            previousLink.replace(/&page=[0-9]+/, "&page=0"),
          ),
          previousLink: replaceAndReloadLink(previousLink),
          nextLink: replaceAndReloadLink(nextLink),
          endLink: replaceAndReloadLink(
            previousLink.replace(
              /&page=[0-9]+/,
              `&page=${Math.floor(
                feedItemsPagination.total / feedItemsPagination.limit,
              )}`,
            ),
          ),
        },
      }),
    );
  });
  app.get("/feed-items/show", async (c) => {
    const id = c.req.query("id");
    const feedId = c.req.query("feedId");

    const { data: feedItem } = await fetch(
      `${apiDomain}/api/feed-items/${encodeURIComponent(id)}/${feedId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${basicAuthInfo.username}:${basicAuthInfo.password}`,
          ).toString("base64")}`,
        },
      },
    ).then((response) => response.json());

    return c.html(
      feedItemsViews.pages.Show({
        feedItem: feedItem,
      }),
    );
  });
  app.get("/feed-items/readability", async (c) => {
    const id = c.req.query("id");
    const feedId = c.req.query("feedId");
    const readability = c.req.query("readability");

    const { data } =
      readability && readability === "true"
        ? await fetch(
            `${apiDomain}/api/feed-items/${encodeURIComponent(
              id,
            )}/${feedId}/extract-content`,
            {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${basicAuthInfo.username}:${basicAuthInfo.password}`,
                ).toString("base64")}`,
              },
            },
          ).then((response) => response.json())
        : await fetch(
            `${apiDomain}/api/feed-items/${encodeURIComponent(id)}/${feedId}`,
            {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${basicAuthInfo.username}:${basicAuthInfo.password}`,
                ).toString("base64")}`,
              },
            },
          ).then((response) => response.json());

    if (readability === "false") {
      return c.html(data.content);
    }

    return c.html(data);
  });
  app.patch("/feed-items/state", async (c) => {
    const body = await c.req.parseBody();
    const id = body.id ?? body["id[]"];
    const feedId = body.feedId;
    const state = body.state;

    if (["read", "unread"].includes(state as string)) {
      await fetch(
        state === "read"
          ? `${apiDomain}/api/feed-items/read`
          : `${apiDomain}/api/feed-items/unread`,
        {
          method: "patch",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${basicAuthInfo.username}:${basicAuthInfo.password}`,
            ).toString("base64")}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(
            !!id && !!feedId
              ? {
                  ids: (Array.isArray(id) ? id : [id]).map((id) => ({
                    id,
                    feedId,
                  })),
                }
              : { feedId },
          ),
        },
      ).then((response) => {
        if (response.status !== 200)
          throw new Error("Could not update feed item state");
      });
    }

    if (["bookmark", "unbookmark"].includes(state as string)) {
      await fetch(
        state === "bookmark"
          ? `${apiDomain}/api/feed-items/bookmark`
          : `${apiDomain}/api/feed-items/unbookmark`,
        {
          method: "patch",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${basicAuthInfo.username}:${basicAuthInfo.password}`,
            ).toString("base64")}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ id, feedId }),
        },
      ).then((response) => {
        if (response.status !== 200)
          throw new Error("Could not update feed item state");
      });
    }

    return c.text("ok");
  });

  app.get("/categories/create", (c) => {
    return c.html(categoriesViews.pages.Create());
  });
  app.get("/categories/edit", async (c) => {
    const id = c.req.query("id");

    const { data: category } = await fetch(
      `${apiDomain}/api/categories/${id}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${basicAuthInfo.username}:${basicAuthInfo.password}`,
          ).toString("base64")}`,
        },
      },
    ).then((response) => response.json());

    return c.html(categoriesViews.pages.Edit({ category }));
  });
  app.post("/categories/edit", async (c) => {
    const { id, ...data } = await c.req.parseBody();

    await fetch(`${apiDomain}/api/categories/${id}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${basicAuthInfo.username}:${basicAuthInfo.password}`,
        ).toString("base64")}`,
        "content-type": "application/json",
      },
      method: "patch",
      body: JSON.stringify(data),
    }).then((response) => response.json());

    return c.text("ok");
  });
  app.post("/categories/create", async (c) => {
    const body = await c.req.parseBody();
    const name = body.name;

    await fetch(`${apiDomain}/api/categories`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${basicAuthInfo.username}:${basicAuthInfo.password}`,
        ).toString("base64")}`,
        "content-type": "application/json",
      },
      method: "post",
      body: JSON.stringify({ name }),
    }).then((response) => {
      if (response.status >= 400) throw new Error("Could not create category");

      return response.json();
    });

    return c.text("ok");
  });
  app.post("/categories/delete", async (c) => {
    const body = await c.req.parseBody();
    const id = body.id;

    await fetch(`${apiDomain}/api/categories/${id}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${basicAuthInfo.username}:${basicAuthInfo.password}`,
        ).toString("base64")}`,
      },
      method: "delete",
    }).then((response) => {
      if (response.status >= 400) throw new Error("Could not create category");
    });

    return c.text("ok");
  });

  app.get("/opml/import", (c) => {
    return c.html(opmlViews.pages.Import());
  });
  app.post("/opml/import", async (c) => {
    console.log(
      'c.req.header("content-length")',
      c.req.header("content-length"),
    );
    await fetch(`${apiDomain}/api/opml/import`, {
      method: "post",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${basicAuthInfo.username}:${basicAuthInfo.password}`,
        ).toString("base64")}`,
        "content-length": c.req.header("content-length") ?? "",
        "content-type": c.req.header("content-type") ?? "",
      },
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      body: Readable.fromWeb(c.req.raw.body as any),
    }).then((response) => {
      if (response.status >= 400) throw new Error("Could not import");
    });

    return c.text("ok");
  });
  app.get("/opml/export", async (c) => {
    const response = await fetch(`${apiDomain}/api/opml/export`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${basicAuthInfo.username}:${basicAuthInfo.password}`,
        ).toString("base64")}`,
      },
    }).then((response) => {
      if (response.status >= 400) throw new Error("Could not export");

      return response;
    });

    c.header("content-type", response.headers.get("content-type") ?? "");
    c.header(
      "content-disposition",
      response.headers.get("content-disposition") ?? "",
    );

    return stream(c, async (x) => {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      for await (const chunk of response.body!) {
        await x.write(chunk);
      }
    });
  });

  return app;
};

export default makeApp;
