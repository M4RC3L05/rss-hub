import { statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { serveStatic } from "@hono/node-server/serve-static";
import config from "config";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import fetch from "node-fetch";
import { requestLifeCycle } from "../../middlewares/mod.js";

const makeApp = () => {
  const app = new Hono();

  app.use("*", requestLifeCycle);
  app.use(
    "*",
    basicAuth({
      username: config.get<{ name: string; pass: string }>("apps.web.basicAuth")
        .name,
      password: config.get<{ name: string; pass: string }>("apps.web.basicAuth")
        .pass,
    }),
  );
  app.use("*", async (c, next) => {
    if (!/^\/(stable|v\d+)/.test(c.req.path ?? "")) return next();

    const target = new URL(c.req.path, config.get<string>("apps.web.esmsh"));
    const targetHeaders = {
      ...Object.fromEntries(c.req.raw.headers.entries()),
      host: target.host,
    };

    const response = await fetch(target, {
      headers: targetHeaders,
      signal: c.req.raw.signal,
    });

    response.headers.delete("content-encoding");
    response.headers.delete("content-length");

    return c.stream(
      async (stream) => {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        for await (const chunk of response.body!) {
          await stream.write(chunk);
        }
      },
      {
        headers: Object.fromEntries(response.headers.entries()),
        status: response.status,
      },
    );
  });

  if (process.env.NODE_ENV !== "production") {
    app.use("*", async (c, next) => {
      if (!c.req.path.endsWith(".js")) {
        return next();
      }

      const swc = await import("@swc/core");
      const pathExists = (path: string) => {
        try {
          const result = statSync(path);

          return result.isFile();
        } catch {
          return false;
        }
      };

      const tsxPath = path.resolve(
        `./src/apps/web/public${c.req.path.replace(".js", ".tsx")}`,
      );
      const tsPath = path.resolve(
        `./src/apps/web/public${c.req.path.replace(".js", ".ts")}`,
      );

      let data: Awaited<ReturnType<typeof swc.transformFile>> | undefined;

      if (pathExists(tsxPath)) {
        data = swc.transformFileSync(tsxPath);
      }

      if (pathExists(tsPath)) {
        data = swc.transformFileSync(tsPath);
      }

      if (!data) return next();

      return c.text(data?.code, 200, {
        "content-type": "application/javascript",
      });
    });
  }

  app.use("*", serveStatic({ root: "./src/apps/web/public" }));

  return app;
};

export default makeApp;
