import http from "node:http";
import { promisify } from "node:util";
import { type AddressInfo } from "node:net";
import process from "node:process";
import { stat } from "node:fs/promises";
import path from "node:path";
import koaStatic from "koa-static";
import config from "config";
import basicAuth from "koa-basic-auth";
import proxy from "koa-proxies";
import makeLogger from "../../common/logger/mod.js";
import { processUtils } from "../../common/utils/mod.js";
import { requestLifeCycle } from "../../common/middlewares/mod.js";
import makeApp from "./app.js";

const log = makeLogger("web");
const app = await makeApp({
  middlewares: {
    requestLifeCycle: requestLifeCycle({ loggerFactory: makeLogger }),
    static: [koaStatic("./src/apps/web/public")],
    basicAuth: basicAuth({ ...config.get<{ name: string; pass: string }>("apps.web.basicAuth") }),
    proxy: proxy(/^\/(stable|v\d+)/, {
      target: config.get("apps.web.esmsh"),
      changeOrigin: true,
    }),
    async swr() {
      const swc = await import("@swc/core");
      const pathExists = async (path: string) => {
        try {
          const result = await stat(path);

          return result.isFile();
        } catch {
          return false;
        }
      };

      return async (ctx, next) => {
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
      };
    },
  },
});

const server = http.createServer(app.callback());
const pClose = promisify<void>(server.close).bind(server);
const { port, host } = config.get<{ port: number; host: string }>("apps.web");

server.listen(port, host, () => {
  const addr = server.address() as AddressInfo;
  log.info(`Listening on ${addr.address}:${addr.port}`);

  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});

server.addListener("close", () => {
  log.info("Server closed");
});

processUtils.addHook({
  name: "web",
  async handler() {
    await pClose().catch((error) => {
      log.error(error, "Could not close server");
    });
  },
});
