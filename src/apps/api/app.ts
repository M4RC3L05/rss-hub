import config from "config";
import { App } from "@m4rc3l05/sss";
import { basicAuth, cors, errorMapper, requestLifeCycle } from "../../middlewares/mod.js";
import { errorMappers } from "../../errors/mod.js";
import { makeRouter } from "./router.js";

const makeApp = async () => {
  const app = new App();

  app.onError(
    errorMapper({
      mappers: [errorMappers.validationErrorMapper, errorMappers.sqliteErrorMapper],
      defaultMapper: errorMappers.defaultErrorMapper,
    }),
  );

  const router = await makeRouter(app);

  app.use(requestLifeCycle);
  app.use(cors);
  app.use(
    basicAuth({
      jsonResponse: true,
      user: config.get<{ name: string; pass: string }>("apps.api.basicAuth"),
    }),
  );
  app.use(router.middleware());
  app.use((_, response) => {
    response.statusCode = 404;

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ error: { code: "not_found", msg: "Not found" } }));
  });

  return app;
};

export default makeApp;
