import { Route, createHashRouter, createRoutesFromElements, useRouteError } from "react-router-dom";
import Layout from "../components/layout.js";
import html from "../common/html.js";

const Error = () => {
  const error = useRouteError();

  console.error(error);

  return html`
    <h1>Something wrong happened!</h1>
    <pre>${JSON.stringify(error, null, 2)}</pre>
  `;
};

const router = createHashRouter(
  createRoutesFromElements(html`
    <${Route} path="/" element=${html`<${Layout} />`} errorElement=${html`<${Error} />`}>
      <${Route}
        index
        lazy=${() => import("./index-page.js")}
        shouldRevalidate=${({ nextUrl }) =>
          nextUrl.searchParams.get("action") === "view" || nextUrl.searchParams.size <= 0}
      />
    <//>
  `),
);

export default router;
