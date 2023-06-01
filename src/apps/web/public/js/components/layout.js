import { Outlet } from "react-router-dom";
import html from "../common/html.js";

const Layout = () => {
  return html`<${Outlet} />`;
};

export default Layout;
