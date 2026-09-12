import { hbox, vbox } from "solid-vanilla";
import { Title } from "./components";

export const Home = () =>
  vbox()
    .css("gap", "1rem")
    .inner(
      Title().css("font-weight", "bold").inner("Music Study"),
      hbox().inner("UI-only placeholder — add your study features here."),
    );
