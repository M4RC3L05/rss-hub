import { type Context, type Next } from "koa";
import { stdSerializers } from "pino";
import type makeLogger from "../logger/mod.js";

type RequestLifeCycleDeps = {
  loggerFactory: typeof makeLogger;
};

const requestLifeCycle = (deps: RequestLifeCycleDeps) => {
  const log = deps.loggerFactory("request-lifecycle-middleware");

  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } finally {
      log.info(
        { request: stdSerializers.req(ctx.req), response: stdSerializers.res(ctx.res) },
        `Request ${ctx.req.method!} ${ctx.req.url!}`,
      );
    }
  };
};

export default requestLifeCycle;
