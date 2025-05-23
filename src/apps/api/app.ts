import config from "config";
import { type ContextVariableMap, Hono } from "@hono/hono";
import { basicAuth } from "@hono/hono/basic-auth";
import { cors } from "@hono/hono/cors";
import { HTTPException } from "@hono/hono/http-exception";
import { errorMappers } from "#src/errors/mod.ts";
import { errorMapper, serviceRegister } from "#src/middlewares/mod.ts";
import { router } from "#src/apps/api/routes/mod.ts";
import type { CustomDatabase } from "#src/database/mod.ts";
import type { FeedService } from "#src/services/mod.ts";

declare module "@hono/hono" {
  interface ContextVariableMap {
    database: CustomDatabase;
    feedService: FeedService;
    shutdown: AbortSignal;
  }
}

export const makeApp = (deps: Partial<ContextVariableMap>) => {
  const app = new Hono();

  app.use("*", serviceRegister(deps));
  app.use("*", cors());
  app.use(
    "*",
    basicAuth({
      ...config.get<{ username: string; password: string }>(
        "apps.api.basicAuth",
      ),
    }),
  );

  app.notFound(() => {
    throw new HTTPException(404, { message: "Route not found" });
  });

  app.onError(
    errorMapper({
      defaultMapper: errorMappers.defaultErrorMapper,
      mappers: [errorMappers.validationErrorMapper],
    }),
  );

  return app.route("/api", router());
};
