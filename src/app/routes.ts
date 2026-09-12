import { HashRouter, div } from "solid-vanilla";
import { StaffPage } from "./staff";

const root = div()
  .css("height", "100%")
  .css("width", "100%")
  .attr("id", "router");

const router = new HashRouter(root);

router.addRoute("/", () => StaffPage());

export { router };
