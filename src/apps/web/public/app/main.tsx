import { SWRConfig } from "swr";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { makeRequester } from "./common/api.js";
import App from "./app.js";

const Root = () => {
  return (
    <SWRConfig value={{ fetcher: makeRequester }}>
      <App />
    </SWRConfig>
  );
};

createRoot(document.querySelector("#app")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
