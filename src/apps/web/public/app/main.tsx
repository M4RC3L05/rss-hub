import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";
import App from "./app.js";
import { makeRequester } from "./common/api.js";

const Root = () => {
  return (
    <SWRConfig value={{ fetcher: makeRequester }}>
      <App />
    </SWRConfig>
  );
};

const appEl = document.querySelector("#app");

if (appEl) {
  createRoot(appEl).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  );
} else {
  throw new Error("No element with id `app` exists.");
}
