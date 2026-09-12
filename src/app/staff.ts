import { button, h, hbox, signal, vbox } from "solid-vanilla";
import type { RNode, Signal } from "solid-vanilla";
import { Title } from "./components";

// --- staff geometry (px) ---
const S = 12; // staff line spacing (one diatonic space)
const VIEW_W = 840;
const STAFF1_TOP = 40; // treble staff
const STAFF1_BOTTOM = STAFF1_TOP + 4 * S;
const STAFF2_TOP = STAFF1_BOTTOM + 3 * S; // bass staff
const STAFF2_BOTTOM = STAFF2_TOP + 4 * S;
const X0 = 96;
const NOTE_DX = 78;
const NOTE_COUNT = 8;

// --- config ---
type StaffMode = "treble" | "bass" | "both";
type ScaleMode = "major" | "minor";
type Note = { n: number; acc: -1 | 0 | 1 }; // n: diatonic index, C4 = 0

const NAMES = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_SEMIS = [0, 2, 4, 5, 7, 9, 11];
const MODE_SEMIS: Record<ScaleMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

// diatonic window per staff layout
const rangeFor = (mode: StaffMode): [number, number] =>
  mode === "treble" ? [0, 7] : mode === "bass" ? [-14, -7] : [-7, 7];

// all scale notes in the window, sharps/flats included
const scaleNotes = (
  root: number,
  mode: ScaleMode,
  range: [number, number],
): Note[] => {
  const out: Note[] = [];
  for (let oct = -2; oct <= 2; oct++) {
    MODE_SEMIS[mode].forEach((semi, i) => {
      const degree = root + i;
      const letter = degree % 7;
      const octave = 4 + oct + Math.floor(degree / 7);
      const base = 12 * (octave + 1) + LETTER_SEMIS[letter];
      const target = 12 * (octave + 1) + LETTER_SEMIS[root] + semi;
      const n = (octave - 4) * 7 + letter;
      if (n < range[0] || n > range[1]) return;
      out.push({ n, acc: (target - base) as -1 | 0 | 1 });
    });
  }
  return out.sort((a, b) => a.n - b.n);
};

const randomNotes = (notes: Note[], count: number) =>
  Array.from(
    { length: count },
    () => notes[Math.floor(Math.random() * notes.length)],
  );

// --- placement ---
const noteStaff = (n: number, mode: StaffMode): "treble" | "bass" =>
  mode === "both" ? (n < 0 ? "bass" : "treble") : mode;

// step relative to the staff's bottom line (even steps sit on lines)
const stepOf = (n: number, staff: "treble" | "bass") =>
  staff === "treble" ? n + 2 : n + 10; // treble bottom = E4, bass bottom = G2

const staffBottom = (staff: "treble" | "bass") =>
  staff === "treble" ? STAFF1_BOTTOM : STAFF2_BOTTOM;

const noteName = (note: Note) => {
  const letter = ((note.n % 7) + 7) % 7;
  const octave = 4 + Math.floor(note.n / 7);
  const acc = note.acc === 1 ? "\u266F" : note.acc === -1 ? "\u266D" : "";
  return `${NAMES[letter]}${acc}${octave}`;
};

// --- svg helpers ---
const FONT = 'font-family="Bravura" fill="#000"';

const staffLines = (top: number) =>
  [0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<line x1="16" y1="${top + i * S}" x2="${VIEW_W - 16}" y2="${top + i * S}" stroke="#000" stroke-width="1.2"/>`,
    )
    .join("");

// accidental glyphs are ~centered on their baseline (font metrics)
const ACC_GLYPH: Record<number, string> = { "1": "\uE262", "-1": "\uE260" };
const ACC_CENTER: Record<number, number> = { "1": 1, "-1": 132 }; // vertical center above baseline, units

const noteSvg = (note: Note, x: number, mode: StaffMode, labels: boolean) => {
  const staff = noteStaff(note.n, mode);
  const step = stepOf(note.n, staff);
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
  const accSize = S * 3;
  const acc =
    note.acc === 0
      ? ""
      : `<text x="${x - rx * 2.6}" y="${(y + (ACC_CENTER[note.acc] * accSize) / 1000).toFixed(1)}" font-size="${accSize}" ${FONT}>${ACC_GLYPH[note.acc]}</text>`;
  const labelY =
    mode === "both"
      ? staff === "treble"
        ? STAFF2_TOP - S * 0.8
        : STAFF2_BOTTOM + 4.4 * S
      : staff === "treble"
        ? STAFF1_BOTTOM + 4.4 * S
        : STAFF2_BOTTOM + 4.4 * S;
  return [
    ledger,
    acc,
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(-20 ${x} ${y})" fill="#111"/>`,
    `<line x1="${stemX}" y1="${y}" x2="${stemX}" y2="${stemEnd}" stroke="#111" stroke-width="1.6"/>`,
    ...(labels
      ? [
          `<text x="${x}" y="${labelY}" font-size="11" text-anchor="middle" fill="#666">${noteName(note)}</text>`,
        ]
      : []),
  ].join("");
};
const accSize = S * 3;

const staffSvg = (notes: Note[], mode: StaffMode, labels: boolean) => {
  const bold = FONT;
  const single = mode !== "both";
  const top1 = single && mode === "bass" ? STAFF2_TOP : STAFF1_TOP;
  const bot = single ? staffBottom(mode) : STAFF2_BOTTOM;
  const viewH = bot + 6 * S;
  let out = staffLines(mode === "bass" ? STAFF2_TOP : STAFF1_TOP);
  if (mode === "both") {
    out += staffLines(STAFF2_TOP);
    // brace spans the grand staff; SMuFL brace sits on its baseline at the
    // bottom and extends exactly 1em (one staff height) upward — stretch to span
    const braceH = STAFF2_BOTTOM - STAFF1_TOP;
    out += `<text transform="translate(10 ${STAFF2_BOTTOM}) scale(1 ${(braceH / (S * 4)).toFixed(3)})" font-size="${S * 4}" ${bold}>&#xE000;</text>`;
  }
  out += `<text x="26" y="${STAFF1_BOTTOM - S}" font-size="${S * 4}" ${bold}>&#xE050;</text>`;
  if (mode !== "treble")
    out += `<text x="26" y="${STAFF2_TOP + S}" font-size="${S * 4.4}" ${bold}>&#xE062;</text>`;
  out += `<line x1="16" y1="${top1}" x2="16" y2="${bot}" stroke="#000" stroke-width="1.2"/>`;
  out += `<line x1="${VIEW_W - 16}" y1="${top1}" x2="${VIEW_W - 16}" y2="${bot}" stroke="#000" stroke-width="1.2"/>`;
  out += notes
    .map((n, i) => noteSvg(n, X0 + i * NOTE_DX, mode, labels))
    .join("");
  return `<svg viewBox="0 0 ${VIEW_W} ${viewH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:860px">${out}</svg>`;
};

// --- ui ---
const Labeled = (label: string, control: RNode) =>
  hbox()
    .css("align-items", "center")
    .inner(
      h("label")
        .css("color", "#666")
        .inner(label + ":"),
      control,
    );

const Select = (val: Signal<string>, options: string[]) => {
  const node = h("select")
    .on("change", (e: Event) => val.set((e.target as HTMLSelectElement).value))
    .inner(...options.map((o) => h("option").inner(o))) as RNode;
  (node.el as unknown as HTMLSelectElement).value = val.get();
  return node;
};

export const StaffPage = () => {
  const staffMode = signal("both");
  const root = signal("C");
  const scaleMode = signal("major");
  const labels = signal("on");
  const nonce = signal(0);

  const staff = h("div").watch(
    [staffMode, root, scaleMode, labels, nonce],
    (n) => {
      const mode = staffMode.get() as StaffMode;
      const notes = scaleNotes(
        NAMES.indexOf(root.get()),
        scaleMode.get() as ScaleMode,
        rangeFor(mode),
      );
      n.el.innerHTML = staffSvg(
        randomNotes(notes, NOTE_COUNT),
        mode,
        labels.get() === "on",
      );
    },
  );

  return vbox().inner(
    Title().css("font-weight", "bold").inner("Grand Staff"),
    hbox()
      .css("gap", "1.5rem")
      .inner(
        Labeled("Staff", Select(staffMode, ["treble", "bass", "both"])),
        Labeled("Key", Select(root, [...NAMES])),
        Labeled("Scale", Select(scaleMode, ["major", "minor"])),
        Labeled("Labels", Select(labels, ["on", "off"])),
        button()
          .on("click", () => nonce.set(nonce.get() + 1, true))
          .inner("New line"),
      ),
    staff,
  );
};
