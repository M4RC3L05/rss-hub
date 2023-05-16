import Koa, { type Middleware } from "koa";

type MakeAppDeps = {
  middlewares: {
    requestLifeCycle: Middleware;
    static: Middleware[];
    basicAuth: Middleware;
  };
};

const makeApp = (deps: MakeAppDeps) => {
  const app = new Koa();

  app.use(deps.middlewares.requestLifeCycle);
  app.use(deps.middlewares.basicAuth);

  for (const s of deps.middlewares.static) {
    app.use(s);
  }

  return app;
};

export default makeApp;
