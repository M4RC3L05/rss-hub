import { type Context, type Next } from "koa";
import { stdSerializers } from "pino";
import { makeLogger } from "../common/logger/mod.js";

const log = makeLogger("request-lifecycle-middleware");

const requestLifeCycle = async (ctx: Context, next: Next) => {
  try {
    await next();
  } finally {
    log.info(
      { request: stdSerializers.req(ctx.req), response: stdSerializers.res(ctx.res) },
      `Request ${ctx.req.method!} ${ctx.req.url!}`,
    );
  }
};

export default requestLifeCycle;
