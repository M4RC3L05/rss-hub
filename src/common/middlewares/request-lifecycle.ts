import { type Context, type Next } from "koa";
import pick from "json-pick-keys";
import createHttpError from "http-errors";
import type makeLogger from "../logger/mod.js";

type RequestLifeCycleDeps = {
  loggerFactory: typeof makeLogger;
};

const requestLifeCycle = (deps: RequestLifeCycleDeps) => {
  const log = deps.loggerFactory("request-lifecycle-middleware");

  return async (ctx: Context, next: Next) => {
    log.info(
      {
        request: Object.assign(
          pick.default(ctx.request, ["method", "url", "header", "body"].join(" ")) as Record<
            string,
            unknown
          >,
          { query: ctx.query, params: (ctx as any)?.params as unknown },
        ),
      },
      `Incomming ${ctx.req.method!} ${ctx.req.url!}`,
    );

    try {
      await next();
    } finally {
      log.info(
        {
          request: Object.assign(
            pick.default(ctx.request, ["method", "url", "header", "body"].join(" ")) as Record<
              string,
              unknown
            >,
            { query: ctx.query, params: (ctx as any)?.params as unknown },
          ),
          response: pick.default(
            ctx.response,
            ["status", "message", "header", "body"].join(" "),
          ) as Record<string, unknown>,
        },
        `Outgoing ${ctx.req.method!} ${ctx.req.url!}`,
      );
    }
  };
};

export default requestLifeCycle;
