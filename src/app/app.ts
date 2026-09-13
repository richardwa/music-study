import { div } from "solid-vanilla";
import { Title } from "./components";
import { router } from "./routes";

export const App = () =>
  div()
    .css("padding", "0.5rem")
    .css("max-width", "940px")
    .css("margin", "0 auto")
    .inner(
      Title()
        .css("font-weight", "bold")
        .css("margin-bottom", "1rem")
        .inner("Music Study"),
      router.getRoot(),
    );
