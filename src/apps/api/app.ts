import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import qs from "koa-qs";
import basicAuth from "koa-basic-auth";
import config from "config";
import { errorMapper, requestLifeCycle } from "../../middlewares/mod.js";
import { errorMappers } from "../../errors/mod.js";
import { router } from "./router.js";

const makeApp = () => {
  const app = new Koa();

  qs(app);

  app.use(requestLifeCycle);
  app.use(
    errorMapper({
      mappers: [errorMappers.validationErrorMapper, errorMappers.sqliteErrorMapper],
      defaultMapper: errorMappers.defaultErrorMapper,
    }),
  );
  app.use(cors());
  app.use(basicAuth({ ...config.get<{ name: string; pass: string }>("apps.api.basicAuth") }));
  app.use(bodyParser());
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
};

export default makeApp;
