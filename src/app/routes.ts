import { HashRouter, div } from "solid-vanilla";
import { Home } from "./home";

const root = div()
  .css("height", "100%")
  .css("width", "100%")
  .attr("id", "router");

const router = new HashRouter(root);

router.addRoute("/", () => Home());

export { router };
