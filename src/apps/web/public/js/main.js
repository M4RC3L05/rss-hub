import { useEffect, StrictMode } from "react";
import { RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { useDarkMode } from "usehooks-ts";
import html from "./common/html.js";
import router from "./pages/mod.js";

const Root = () => {
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    document.documentElement.dataset.bsTheme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  return html``;
};

createRoot(document.querySelector("#app")).render(html`
  <${StrictMode}>
    <${Root} />
    <${RouterProvider} router=${router} />
  <//>
`);
