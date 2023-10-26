import http from "node:http";
import { promisify } from "node:util";
import { type AddressInfo } from "node:net";
import process from "node:process";
import config from "config";
import { makeLogger } from "../../common/logger/mod.js";
import { addHook } from "../../common/utils/process-utils.js";
import { db } from "../../database/mod.js";
import makeApp from "./app.js";

const log = makeLogger("api");
const app = makeApp();

const { port, host } = config.get<{ port: number; host: string }>("apps.api");
const server = http.createServer(app.handle());
const pClose = promisify<void>(server.close).bind(server);

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

addHook({
  name: "api",
  async handler() {
    await pClose().catch((error) => {
      log.error(error, "Could not close server");
    });
    log.info("Server closed");

    db.close();
    log.info("DB Closed");
  },
});
