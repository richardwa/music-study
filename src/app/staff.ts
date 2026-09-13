import { button, h, hbox, signal, vbox } from "solid-vanilla";
import type { RNode, Signal } from "solid-vanilla";

// --- staff geometry (px) ---
const S = 12; // staff line spacing (one diatonic space)
const VIEW_W = 840;
const STAFF1_TOP = 56; // treble staff
const STAFF1_BOTTOM = STAFF1_TOP + 4 * S;
const STAFF2_TOP = STAFF1_BOTTOM + 3 * S; // bass staff
const STAFF2_BOTTOM = STAFF2_TOP + 4 * S;
const BOTTOM_PAD = 9 * S; // room for ledger notes + labels below bass staff
const X0 = 104;
const NOTE_DX = 46;
const NOTE_COUNT = 16;

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

// midi note number for a Note
const noteMidi = (note: Note) => {
  const letter = ((note.n % 7) + 7) % 7;
  const octave = 4 + Math.floor(note.n / 7);
  return 12 * (octave + 1) + LETTER_SEMIS[letter] + note.acc;
};

// --- placement ---
const noteStaff = (n: number, mode: StaffMode): "treble" | "bass" =>
  mode === "both" ? (n < 0 ? "bass" : "treble") : mode;

// step relative to the staff's bottom line (even steps sit on lines)
const stepOf = (n: number, staff: "treble" | "bass") =>
  staff === "treble" ? n - 2 : n + 10; // treble bottom = E4 (n=2), bass bottom = G2 (n=-10)

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

// head position of a note at slot x
const notePos = (note: Note, x: number, mode: StaffMode, dy: number) => {
  const staff = noteStaff(note.n, mode);
  const step = stepOf(note.n, staff);
  return {
    y: staffBottom(staff) - step * (S / 2) + dy,
  };
};

const cursorSvg = (
  note: Note,
  x: number,
  mode: StaffMode,
  bad: boolean,
  dy: number,
) => {
  const { y } = notePos(note, x, mode, dy);
  const w = S * 1.6;
  const h = S * 1.1;
  const color = bad ? "220,60,60" : "60,200,60";
  return `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="rgba(${color},0.35)" stroke="rgb(${color})" stroke-width="1.5"/>`;
};

const noteSvg = (
  note: Note,
  x: number,
  mode: StaffMode,
  labels: boolean,
  dy: number,
) => {
  const staff = noteStaff(note.n, mode);
  const step = stepOf(note.n, staff);
  const y = staffBottom(staff) - step * (S / 2) + dy;
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
    staff === "treble"
      ? mode === "both"
        ? STAFF2_TOP - S * 0.8
        : STAFF1_BOTTOM + 4.4 * S
      : STAFF2_BOTTOM + 4.4 * S;
  const labelYAbs = labelY + dy;
  return [
    ledger,
    acc,
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(-20 ${x} ${y})" fill="#111"/>`,
    `<line x1="${stemX}" y1="${y}" x2="${stemX}" y2="${stemEnd}" stroke="#111" stroke-width="1.6"/>`,
    ...(labels
      ? [
          `<text x="${x}" y="${labelYAbs}" font-size="11" text-anchor="middle" fill="#666">${noteName(note)}</text>`,
        ]
      : []),
  ].join("");
};
const accSize = S * 3;

const staffSvg = (
  notes: Note[],
  mode: StaffMode,
  labels: boolean,
  cursor: number,
  bad: boolean,
) => {
  const bold = FONT;
  const top1 = mode === "bass" ? STAFF2_TOP : STAFF1_TOP;
  const bot = mode === "both" ? STAFF2_BOTTOM : staffBottom(mode);
  const viewH = bot + BOTTOM_PAD;
  let out = staffLines(STAFF1_TOP);
  if (mode === "both") {
    out += staffLines(STAFF2_TOP);
    // brace spans the grand staff; SMuFL brace sits on its baseline at the
    // bottom and extends exactly 1em (one staff height) upward — stretch to span
    const braceH = STAFF2_BOTTOM - STAFF1_TOP;
    out += `<text transform="translate(10 ${STAFF2_BOTTOM}) scale(1 ${(braceH / (S * 4)).toFixed(3)})" font-size="${S * 4}" ${bold}>&#xE000;</text>`;
  }
  if (mode !== "bass")
    out += `<text x="26" y="${STAFF1_BOTTOM - S}" font-size="${S * 4}" ${bold}>&#xE050;</text>`;
  if (mode !== "treble")
    out += `<text x="26" y="${STAFF2_TOP + S}" font-size="${S * 4.4}" ${bold}>&#xE062;</text>`;
  out += `<line x1="16" y1="${top1}" x2="16" y2="${bot}" stroke="#000" stroke-width="1.2"/>`;
  out += `<line x1="${VIEW_W - 16}" y1="${top1}" x2="${VIEW_W - 16}" y2="${bot}" stroke="#000" stroke-width="1.2"/>`;
  // bar lines between groups of 4 notes
  for (let k = 1; k * 4 < NOTE_COUNT; k++) {
    const x = X0 + k * 4 * NOTE_DX - NOTE_DX / 2;
    out += `<line x1="${x}" y1="${top1}" x2="${x}" y2="${bot}" stroke="#000" stroke-width="1.2"/>`;
  }
  if (cursor < notes.length)
    out += cursorSvg(notes[cursor], X0 + cursor * NOTE_DX, mode, bad, 0);
  out += notes
    .map((n, i) => noteSvg(n, X0 + i * NOTE_DX, mode, labels, 0))
    .join("");
  return `<svg viewBox="0 0 ${VIEW_W} ${viewH}" xmlns="http://www.w3.org/2000/svg" style="width:100%">${out}</svg>`;
};

// --- ui ---
const Labeled = (label: string, control: RNode) =>
  vbox()
    .css("gap", "0.25rem")
    .inner(
      h("label").css("color", "#666").css("font-size", "0.8rem").inner(label),
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
  const staffMode = signal("both").persistAs("music-study:staffMode");
  const root = signal("C").persistAs("music-study:key");
  const scaleMode = signal("major").persistAs("music-study:scaleMode");
  const labels = signal("on").persistAs("music-study:labels");
  const midiStatus = signal("midi: …");
  const notesSig = signal<Note[]>([]);
  const cursor = signal(0);
  const badFlash = signal(false);
  const scoreSig = signal("");
  const wrongSig = signal("");

  // per-line key press tracking
  let attempts = 0;
  let correct = 0;
  let incorrect = 0;

  const genNotes = () => {
    attempts = 0;
    correct = 0;
    incorrect = 0;
    scoreSig.set(`0/${NOTE_COUNT} correct (0%)`);
    wrongSig.set("0 wrong presses");
    const notes = scaleNotes(
      NAMES.indexOf(root.get()),
      scaleMode.get() as ScaleMode,
      rangeFor(staffMode.get() as StaffMode),
    );
    notesSig.set(randomNotes(notes, NOTE_COUNT));
    cursor.set(0);
  };

  // regenerate on config change
  h("div").watch([staffMode, root, scaleMode], () => genNotes());

  const staffDiv = h("div");
  const redraw = () => {
    staffDiv.el.innerHTML = staffSvg(
      notesSig.get(),
      staffMode.get() as StaffMode,
      labels.get() === "on",
      cursor.get(),
      badFlash.get(),
    );
  };
  staffDiv.watch([notesSig, cursor, labels, badFlash], redraw);

  // --- midi ---
  let midiAccess: any;
  let flashTimer: ReturnType<typeof setTimeout> | undefined;

  const tallyText = (prefix = "") => {
    const pct = Math.round((correct / NOTE_COUNT) * 100);
    return `${prefix}${correct}/${NOTE_COUNT} correct (${pct}%)`;
  };

  const updateScore = () => {
    scoreSig.set(tallyText());
    wrongSig.set(`${incorrect} wrong presses`);
  };

  // session over: show the final tally and stop accepting presses
  const endSession = () =>
    scoreSig.set(tallyText("\u2713 session complete \u2014 "));
  wrongSig.set(`${incorrect} wrong presses`);

  const onMidiNote = (midi: number) => {
    const notes = notesSig.get();
    const i = cursor.get();
    if (i >= notes.length) return; // session done — press Start for a new set
    attempts++;
    if (midi === noteMidi(notes[i])) {
      correct++;
      if (i + 1 < notes.length) {
        updateScore();
        cursor.set(i + 1);
      } else {
        // last note reached: move the cursor past the end so the
        // "i >= notes.length" guard ignores further presses until Start
        cursor.set(notes.length);
        endSession();
      }
    } else {
      incorrect++;
      updateScore();
      badFlash.set(true);
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => badFlash.set(false), 350);
    }
  };

  const setupMidi = async () => {
    const nav = navigator as Navigator & {
      requestMIDIAccess?: () => Promise<any>;
    };
    if (!nav.requestMIDIAccess) {
      midiStatus.set("midi: unsupported");
      return;
    }
    try {
      const access = await nav.requestMIDIAccess();
      midiAccess = access;
      const bind = () => {
        let count = 0;
        access.inputs.forEach((input: any) => {
          count++;
          input.onmidimessage = (e: any) => {
            const [status, d1, d2] = e.data;
            if ((status & 0xf0) === 0x90 && d2 > 0) onMidiNote(d1);
          };
        });
        midiStatus.set(count ? `midi: ${count} device(s)` : "midi: no device");
      };
      bind();
      access.onstatechange = bind;
    } catch {
      midiStatus.set("midi: access denied");
    }
  };
  setupMidi();

  // --- practice session ---
  const startBtn = button()
    .on("click", () => genNotes())
    .inner("Start");

  return vbox().inner(
    h("div")
      .css("position", "absolute")
      .css("top", "0.5rem")
      .css("right", "0.5rem")
      .css("display", "flex")
      .css("justify-content", "flex-end")
      .inner(
        h("span")
          .css("color", "#888")
          .css("font-size", "0.85rem")
          .watch(midiStatus, (n) => (n.el.textContent = midiStatus.get())),
      ),
    hbox()
      .css("gap", "1.25rem")
      .css("flex-wrap", "wrap")
      .css("align-items", "center")
      .inner(
        Labeled("Staff", Select(staffMode, ["treble", "bass", "both"])),
        Labeled("Key", Select(root, [...NAMES])),
        Labeled("Scale", Select(scaleMode, ["major", "minor"])),
        Labeled("Labels", Select(labels, ["on", "off"])),
      ),
    hbox()
      .css("justify-content", "space-between")
      .css("align-items", "center")
      .css("padding", "0.25rem 0")
      .inner(
        startBtn,
        h("div").inner(
          h("span")
            .css("font-weight", "bold")
            .css("color", "#15803d")
            .watch(scoreSig, (n) => (n.el.textContent = scoreSig.get())),
          h("span")
            .css("font-weight", "bold")
            .css("color", "#dc2626")
            .css("margin-left", "0.75rem")
            .watch(wrongSig, (n) => (n.el.textContent = wrongSig.get())),
        ),
      ),
    staffDiv,
  );
};
