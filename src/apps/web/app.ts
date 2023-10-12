import process from "node:process";
import { stat } from "node:fs/promises";
import path from "node:path";
import Koa from "koa";
import basicAuth from "koa-basic-auth";
import config from "config";
import koaStatic from "koa-static";
import proxy from "koa-proxies";
import { requestLifeCycle } from "../../middlewares/mod.js";

const makeApp = async () => {
  const app = new Koa();

  app.use(requestLifeCycle);
  app.use(basicAuth({ ...config.get<{ name: string; pass: string }>("apps.web.basicAuth") }));

  app.use(
    proxy(/^\/(stable|v\d+)/, {
      target: config.get("apps.web.esmsh"),
      changeOrigin: true,
    }),
  );

  if (process.env.NODE_ENV !== "production") {
    const swc = await import("@swc/core");
    const pathExists = async (path: string) => {
      try {
        const result = await stat(path);

        return result.isFile();
      } catch {
        return false;
      }
    };

    app.use(async (ctx, next) => {
      if (!ctx.url.endsWith(".js")) {
        return next();
      }

      const tsxPath = path.resolve(`./src/apps/web/public${ctx.url.replace(".js", ".tsx")}`);
      const tsPath = path.resolve(`./src/apps/web/public${ctx.url.replace(".js", ".ts")}`);

      let data: Awaited<ReturnType<typeof swc.transformFile>> | undefined;

      if (await pathExists(tsxPath)) {
        data = await swc.transformFile(tsxPath);
      }

      if (await pathExists(tsPath)) {
        data = await swc.transformFile(tsPath);
      }

      if (!data) return next();

      ctx.type = "application/javascript";
      ctx.body = data?.code;
    });
  }

  app.use(koaStatic("./src/apps/web/public"));

  return app;
};

export default makeApp;
