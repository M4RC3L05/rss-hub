import config from "config";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { type CustomDatabase } from "../../database/mod.js";
import { errorMappers } from "../../errors/mod.js";
import { errorMapper, requestLifeCycle } from "../../middlewares/mod.js";
import { router } from "./router.js";

const makeApp = ({ database }: { database: CustomDatabase }) => {
  const app = new Hono();

  app.use("*", (c, next) => {
    c.set("database", database);

    return next();
  });
  app.use("*", requestLifeCycle);
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
