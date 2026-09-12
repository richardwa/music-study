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

const staffSvg = (notes: number[]) => {
  const bold = 'font-family="Bravura" fill="#000"';
  // brace spans the full grand staff; SMuFL brace sits on its baseline at the
  // bottom and extends exactly 1em (one staff height) upward — stretch to span
  const braceH = STAFF2_BOTTOM - STAFF1_TOP;
  const brace = `<text transform="translate(10 ${STAFF2_BOTTOM}) scale(1 ${(braceH / (S * 4)).toFixed(3)})" font-size="${S * 4}" ${bold}>&#xE000;</text>`;
  const trebleClef = `<text x="26" y="${STAFF1_BOTTOM - S}" font-size="${S * 4}" ${bold}>&#xE050;</text>`;
  const bassClef = `<text x="26" y="${STAFF2_TOP + S}" font-size="${S * 4}" ${bold}>&#xE062;</text>`;
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
