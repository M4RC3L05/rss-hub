import config from "config";
import { type ContextVariableMap, Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { DeepPartial } from "#src/common/utils/types.js";
import { errorMappers } from "#src/errors/mod.js";
import {
  errorMapper,
  requestLifeCycle,
  serviceRegister,
} from "#src/middlewares/mod.js";
import { router } from "./router.js";

const makeApp = (deps: DeepPartial<ContextVariableMap>) => {
  const app = new Hono();

  app.use("*", requestLifeCycle);
  app.use("*", serviceRegister(deps));
  app.use("*", cors());
  app.use(
    "*",
    basicAuth({
      username: config.get<{ name: string; pass: string }>("apps.api.basicAuth")
        .name,
      password: config.get<{ name: string; pass: string }>("apps.api.basicAuth")
        .pass,
    }),
  );

  app.notFound(() => {
    throw new HTTPException(404, { message: "Route not found" });
  });

  app.onError(
    errorMapper({
      mappers: [
        errorMappers.validationErrorMapper,
        errorMappers.sqliteErrorMapper,
      ],
      defaultMapper: errorMappers.defaultErrorMapper,
    }),
  );

  router(app);

  return app;
};

export default makeApp;
