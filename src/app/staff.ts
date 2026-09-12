import { button, h, hbox, signal, vbox } from "solid-vanilla";
import { Title } from "./components";

// --- staff geometry (px) ---
const S = 12; // staff line spacing (one diatonic space)
const VIEW_W = 840;
const STAFF1_TOP = 40; // treble staff
const STAFF1_BOTTOM = STAFF1_TOP + 4 * S;
const STAFF2_TOP = STAFF1_BOTTOM + 3 * S; // bass staff
const STAFF2_BOTTOM = STAFF2_TOP + 4 * S;
const VIEW_H = STAFF2_BOTTOM + 6 * S;
const X0 = 96;
const NOTE_DX = 78;
const NOTE_COUNT = 8;

// diatonic index: C4 = 0, negative = below
const MIN = -7; // C3
const MAX = 7; // C5
const NAMES = ["C", "D", "E", "F", "G", "A", "B"];

type Staff = "treble" | "bass";

const noteStaff = (n: number): Staff => (n < 0 ? "bass" : "treble");

// step relative to the staff's bottom line (even steps sit on lines)
const stepOf = (n: number, staff: Staff) =>
  staff === "treble" ? n + 2 : n + 10; // treble bottom = E4, bass bottom = G2

const staffBottom = (staff: Staff) =>
  staff === "treble" ? STAFF1_BOTTOM : STAFF2_BOTTOM;

const noteName = (n: number) =>
  `${NAMES[((n % 7) + 7) % 7]}${4 + Math.floor(n / 7)}`;

const randomNotes = (count: number) =>
  Array.from(
    { length: count },
    () => MIN + Math.floor(Math.random() * (MAX - MIN + 1)),
  );

const staffLines = (top: number) =>
  [0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<line x1="16" y1="${top + i * S}" x2="${VIEW_W - 16}" y2="${top + i * S}" stroke="#000" stroke-width="1.2"/>`,
    )
    .join("");

const noteSvg = (n: number, x: number) => {
  const staff = noteStaff(n);
  const step = stepOf(n, staff);
  const bottom = staffBottom(staff);
  const y = bottom - step * (S / 2);
  const rx = S * 0.68;
  const ry = S * 0.48;
  const stemUp = step < 4; // below middle line
  const stemX = stemUp ? x + rx * 0.9 : x - rx * 0.9;
  const stemEnd = stemUp ? y - 3.4 * S : y + 3.4 * S;
  const ledger =
    step <= -2 || step >= 10
      ? `<line x1="${x - rx * 1.7}" y1="${y}" x2="${x + rx * 1.7}" y2="${y}" stroke="#000" stroke-width="1.2"/>`
      : "";
  const labelY =
    staff === "treble" ? STAFF2_TOP - S * 0.8 : STAFF2_BOTTOM + 4.4 * S;
  return [
    ledger,
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(-20 ${x} ${y})" fill="#111"/>`,
    `<line x1="${stemX}" y1="${y}" x2="${stemX}" y2="${stemEnd}" stroke="#111" stroke-width="1.6"/>`,
    `<text x="${x}" y="${labelY}" font-size="11" text-anchor="middle" fill="#666">${noteName(n)}</text>`,
  ].join("");
};

// curly brace path spanning y1..y2 at given x, bulging left
const bracePath = (x: number, y1: number, y2: number) => {
  const mid = (y1 + y2) / 2;
  const w = (y2 - y1) * 0.06; // bulge depth
  return `
    M ${x} ${y1}
    C ${x - w} ${y1 + (mid - y1) * 0.55}, ${x - w} ${mid - (mid - y1) * 0.35}, ${x} ${mid}
    C ${x - w} ${mid + (mid - y1) * 0.35}, ${x - w} ${y2 - (mid - y1) * 0.55}, ${x} ${y2}
    C ${x + w * 0.35} ${y2 - (mid - y1) * 0.35}, ${x + w * 0.35} ${mid + (mid - y1) * 0.4}, ${x + w * 0.5} ${mid}
    C ${x + w * 0.35} ${mid - (mid - y1) * 0.4}, ${x + w * 0.35} ${y1 + (mid - y1) * 0.35}, ${x} ${y1}
    Z`
    .replace(/\s+/g, " ")
    .trim();
};

const staffSvg = (notes: number[]) => {
  const brace = `<path d="${bracePath(14, STAFF1_TOP, STAFF2_BOTTOM)}" fill="#000"/>`;
  const trebleClef = `<text x="26" y="${STAFF1_BOTTOM - S * 0.1}" font-size="${S * 3.4}" fill="#000">&#x1D11E;</text>`;
  const bassClef = `<text x="26" y="${STAFF2_TOP + 3.4 * S}" font-size="${S * 4}" fill="#000">&#x1D122;</text>`;
  const joinTop = `<line x1="16" y1="${STAFF1_TOP}" x2="16" y2="${STAFF2_BOTTOM}" stroke="#000" stroke-width="1.2"/>`;
  const joinBottom = `<line x1="${VIEW_W - 16}" y1="${STAFF1_TOP}" x2="${VIEW_W - 16}" y2="${STAFF2_BOTTOM}" stroke="#000" stroke-width="1.2"/>`;
  const notesSvg = notes.map((n, i) => noteSvg(n, X0 + i * NOTE_DX)).join("");
  return `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:860px">${staffLines(STAFF1_TOP)}${staffLines(STAFF2_TOP)}${brace}${trebleClef}${bassClef}${joinTop}${joinBottom}${notesSvg}</svg>`;
};

export const StaffPage = () => {
  const nonce = signal(0);

  const staff = h("div").watch(nonce, (n) => {
    n.el.innerHTML = staffSvg(randomNotes(NOTE_COUNT));
  });

  return vbox().inner(
    Title().css("font-weight", "bold").inner("C Major — Grand Staff"),
    staff,
    hbox().inner(
      button()
        .on("click", () => nonce.set(nonce.get() + 1, true))
        .inner("New line"),
    ),
  );
};
