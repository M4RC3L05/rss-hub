import http from "node:http";
import { promisify } from "node:util";
import process from "node:process";
import { type AddressInfo } from "node:net";
import config from "config";
import { makeLogger } from "../../common/logger/mod.js";
import { addHook } from "../../common/utils/process-utils.js";
import makeApp from "./app.js";

const log = makeLogger("web");
const app = await makeApp();

const server = http.createServer(app.handle());
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

addHook({
  name: "web",
  async handler() {
    await pClose().catch((error) => {
      log.error(error, "Could not close server");
    });
    log.info("Server closed");
  },
});
