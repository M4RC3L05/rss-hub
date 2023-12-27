import process from "node:process";
import { createAdaptorServer, serve } from "@hono/node-server";
import config from "config";
import { makeLogger } from "../../common/logger/mod.js";
import { addHook } from "../../common/utils/process-utils.js";
import makeApp from "./app.js";

addHook({
  name: "web",
  async handler() {
    if (server) {
      try {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) reject(error);
            else resolve();
          });
        });

        log.info("Server closed");
      } catch (error) {
        log.error(error, "Error while closing server");
      }
    }
  },
});

const { port, host } = config.get<{ port: number; host: string }>("apps.web");
const log = makeLogger("web");

const app = makeApp();
const server = createAdaptorServer(app);

server.listen({ port, hostname: host }, () => {
  log.info(`Listening on ${host}:${port}`);
});

server.once("listening", () => {
  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});
