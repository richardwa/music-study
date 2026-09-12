import { button, h, hbox, signal, vbox } from "solid-vanilla";
import { Title } from "./components";

// --- staff geometry (px) ---
const S = 12; // staff line spacing (one diatonic space)
const VIEW_W = 840;
const VIEW_H = 160;
const STAFF_TOP = 45;
const STAFF_BOTTOM = STAFF_TOP + 4 * S;
const X0 = 96;
const NOTE_DX = 78;
const NOTE_COUNT = 8;

// diatonic steps relative to bottom staff line (E4 = 0)
const C4 = -2;
const C5 = 7;
const NAMES = ["C", "D", "E", "F", "G", "A", "B"];

const stepName = (step: number) => {
  const i = step - C4;
  return `${NAMES[i % 7]}${4 + Math.floor(i / 7)}`;
};

const randomSteps = (count: number) =>
  Array.from(
    { length: count },
    () => C4 + Math.floor(Math.random() * (C5 - C4 + 1)),
  );

const noteSvg = (step: number, x: number) => {
  const y = STAFF_BOTTOM - step * (S / 2);
  const rx = S * 0.68;
  const ry = S * 0.48;
  const stemUp = step < 3; // below middle line B4
  const stemX = stemUp ? x + rx * 0.9 : x - rx * 0.9;
  const stemEnd = stemUp ? y - 3.4 * S : y + 3.4 * S;
  const ledger =
    step <= -2
      ? `<line x1="${x - rx * 1.7}" y1="${y}" x2="${x + rx * 1.7}" y2="${y}" stroke="#000" stroke-width="1.2"/>`
      : "";
  return [
    ledger,
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(-20 ${x} ${y})" fill="#111"/>`,
    `<line x1="${stemX}" y1="${y}" x2="${stemX}" y2="${stemEnd}" stroke="#111" stroke-width="1.6"/>`,
    `<text x="${x}" y="${STAFF_BOTTOM + 4.4 * S}" font-size="11" text-anchor="middle" fill="#666">${stepName(step)}</text>`,
  ].join("");
};

const staffSvg = (steps: number[]) => {
  const lines = [0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<line x1="16" y1="${STAFF_TOP + i * S}" x2="${VIEW_W - 16}" y2="${STAFF_TOP + i * S}" stroke="#000" stroke-width="1.2"/>`,
    )
    .join("");
  const clef = `<text x="24" y="${STAFF_BOTTOM + S * 0.4}" font-size="${S * 5.6}" fill="#000">&#x1D11E;</text>`;
  const notes = steps.map((s, i) => noteSvg(s, X0 + i * NOTE_DX)).join("");
  return `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:860px">${lines}${clef}${notes}</svg>`;
};

export const StaffPage = () => {
  const nonce = signal(0);

  const staff = h("div").watch(nonce, (n) => {
    n.el.innerHTML = staffSvg(randomSteps(NOTE_COUNT));
  });

  return vbox().inner(
    Title().css("font-weight", "bold").inner("C Major — Staff"),
    staff,
    hbox().inner(
      button()
        .on("click", () => nonce.set(nonce.get() + 1, true))
        .inner("New line"),
    ),
  );
};
