import type koaQs from "koa-qs";
import type Router from "@koa/router";
import Koa, { type Middleware } from "koa";

type MakeAppDeps = {
  router: Router;
  middlewares: {
    basicAuth: Middleware;
    cors: Middleware;
    requestLifeCycle: Middleware;
    bodyParser: Middleware;
    errorMapper: Middleware;
    qs: typeof koaQs;
  };
};

const makeApp = (deps: MakeAppDeps) => {
  const app = new Koa();

  deps.middlewares.qs(app);

  app.use(deps.middlewares.requestLifeCycle);
  app.use(deps.middlewares.errorMapper);
  app.use(deps.middlewares.cors);
  app.use(deps.middlewares.basicAuth);
  app.use(deps.middlewares.bodyParser);
  app.use(deps.router.routes());
  app.use(deps.router.allowedMethods());

  return app;
};

export default makeApp;
