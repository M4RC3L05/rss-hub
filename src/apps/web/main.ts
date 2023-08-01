import http from "node:http";
import { promisify } from "node:util";
import { type AddressInfo } from "node:net";
import process from "node:process";
import koaStatic from "koa-static";
import config from "config";
import basicAuth from "koa-basic-auth";
import proxy from "koa-proxies";
import makeLogger, { destination } from "../../common/logger/mod.js";
import { processUtils } from "../../common/utils/mod.js";
import { requestLifeCycle } from "../../common/middlewares/mod.js";
import makeApp from "./app.js";

const log = makeLogger("web");
const app = makeApp({
  middlewares: {
    requestLifeCycle: requestLifeCycle({ loggerFactory: makeLogger }),
    static: [koaStatic("./src/apps/web/public")],
    basicAuth: basicAuth({ ...config.get<{ name: string; pass: string }>("apps.web.basicAuth") }),
    proxy: proxy(/^\/(stable|v\d+)/, {
      target: config.get("apps.web.esmsh"),
      changeOrigin: true,
    }),
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

    destination.flushSync();
  },
});
