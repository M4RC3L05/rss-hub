import process from "node:process";
import Koa, { type Middleware } from "koa";

type MakeAppDeps = {
  middlewares: {
    requestLifeCycle: Middleware;
    static: Middleware[];
    basicAuth: Middleware;
    proxy: Middleware;
    swr: () => Promise<Middleware>;
  };
};

const makeApp = async (deps: MakeAppDeps) => {
  const app = new Koa();

  app.use(deps.middlewares.requestLifeCycle);
  app.use(deps.middlewares.basicAuth);

  app.use(deps.middlewares.proxy);

  if (process.env.NODE_ENV !== "production") {
    app.use(await deps.middlewares.swr());
  }

  for (const s of deps.middlewares.static) {
    app.use(s);
  }

  return app;
};

export default makeApp;
