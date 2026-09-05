export const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

export type AccidentalPref = "sharp" | "flat";

export const KEYS: { index: number; sharp: string; flat: string }[] = SHARP_NOTES.map((sharp, index) => ({
  index,
  sharp,
  flat: FLAT_NOTES[index]!,
}));

export function noteName(semitone: number, pref: AccidentalPref): string {
  const i = ((semitone % 12) + 12) % 12;
  return pref === "flat" ? FLAT_NOTES[i]! : SHARP_NOTES[i]!;
}

export function prefersFlats(keyIndex: number, scaleId: string): boolean {
  const minorish = new Set([
    "minor",
    "aeolian",
    "dorian",
    "phrygian",
    "locrian",
    "minorPent",
    "blues",
    "harmonicMinor",
    "melodicMinor",
    "hijaz",
    "doubleHarmonic",
    "persian",
    "hungarianMinor",
    "romanianMinor",
    "hirajoshi",
    "insen",
    "kumoi",
    "iwato",
    "pelog",
    "egyptian",
  ]);
  if (minorish.has(scaleId)) {
    return [0, 2, 3, 5, 7, 8, 10].includes(keyIndex);
  }
  return [3, 5, 8, 10].includes(keyIndex);
}

export type ScaleGroup = "core" | "modes" | "world";

export interface ScaleDef {
  id: string;
  name: string;
  group: ScaleGroup;
  intervals: number[];
  degrees: string[];
  flavor?: string;
}

export const SCALE_GROUPS: { id: ScaleGroup; name: string }[] = [
  { id: "core", name: "Core" },
  { id: "modes", name: "Modes" },
  { id: "world", name: "World" },
];

export const SCALES: ScaleDef[] = [
  { id: "major", name: "Major", group: "core", intervals: [0, 2, 4, 5, 7, 9, 11], degrees: ["1", "2", "3", "4", "5", "6", "7"] },
  { id: "minor", name: "Natural minor", group: "core", intervals: [0, 2, 3, 5, 7, 8, 10], degrees: ["1", "2", "b3", "4", "5", "b6", "b7"] },
  { id: "majorPent", name: "Major pentatonic", group: "core", intervals: [0, 2, 4, 7, 9], degrees: ["1", "2", "3", "5", "6"] },
  { id: "minorPent", name: "Minor pentatonic", group: "core", intervals: [0, 3, 5, 7, 10], degrees: ["1", "b3", "4", "5", "b7"] },
  { id: "blues", name: "Blues", group: "core", intervals: [0, 3, 5, 6, 7, 10], degrees: ["1", "b3", "4", "b5", "5", "b7"] },
  { id: "harmonicMinor", name: "Harmonic minor", group: "core", intervals: [0, 2, 3, 5, 7, 8, 11], degrees: ["1", "2", "b3", "4", "5", "b6", "7"] },
  { id: "melodicMinor", name: "Melodic minor", group: "core", intervals: [0, 2, 3, 5, 7, 9, 11], degrees: ["1", "2", "b3", "4", "5", "6", "7"] },
  { id: "dorian", name: "Dorian", group: "modes", intervals: [0, 2, 3, 5, 7, 9, 10], degrees: ["1", "2", "b3", "4", "5", "6", "b7"] },
  { id: "phrygian", name: "Phrygian", group: "modes", intervals: [0, 1, 3, 5, 7, 8, 10], degrees: ["1", "b2", "b3", "4", "5", "b6", "b7"] },
  { id: "lydian", name: "Lydian", group: "modes", intervals: [0, 2, 4, 6, 7, 9, 11], degrees: ["1", "2", "3", "#4", "5", "6", "7"] },
  { id: "mixolydian", name: "Mixolydian", group: "modes", intervals: [0, 2, 4, 5, 7, 9, 10], degrees: ["1", "2", "3", "4", "5", "6", "b7"] },
  { id: "locrian", name: "Locrian", group: "modes", intervals: [0, 1, 3, 5, 6, 8, 10], degrees: ["1", "b2", "b3", "4", "b5", "b6", "b7"] },
  {
    id: "hijaz",
    name: "Hijaz",
    group: "world",
    intervals: [0, 1, 4, 5, 7, 8, 10],
    degrees: ["1", "b2", "3", "4", "5", "b6", "b7"],
    flavor: "Arabic maqam · flamenco · Phrygian dominant",
  },
  {
    id: "doubleHarmonic",
    name: "Double harmonic",
    group: "world",
    intervals: [0, 1, 4, 5, 7, 8, 11],
    degrees: ["1", "b2", "3", "4", "5", "b6", "7"],
    flavor: "Arabic / Byzantine · Gypsy major",
  },
  {
    id: "persian",
    name: "Persian",
    group: "world",
    intervals: [0, 1, 4, 5, 6, 8, 11],
    degrees: ["1", "b2", "3", "4", "b5", "b6", "7"],
    flavor: "Persian · hard Hijaz color",
  },
  {
    id: "hungarianMinor",
    name: "Hungarian minor",
    group: "world",
    intervals: [0, 2, 3, 6, 7, 8, 11],
    degrees: ["1", "2", "b3", "#4", "5", "b6", "7"],
    flavor: "Gypsy jazz · Hungarian Gypsy",
  },
  {
    id: "hungarianMajor",
    name: "Hungarian major",
    group: "world",
    intervals: [0, 3, 4, 6, 7, 9, 10],
    degrees: ["1", "#2", "3", "#4", "5", "6", "b7"],
    flavor: "Hungarian · bright Gypsy",
  },
  {
    id: "romanianMinor",
    name: "Romanian minor",
    group: "world",
    intervals: [0, 2, 3, 6, 7, 9, 10],
    degrees: ["1", "2", "b3", "#4", "5", "6", "b7"],
    flavor: "Ukrainian Dorian · klezmer",
  },
  {
    id: "chineseGong",
    name: "Chinese Gong",
    group: "world",
    intervals: [0, 2, 4, 7, 9],
    degrees: ["1", "2", "3", "5", "6"],
    flavor: "宫 商 角 徵 羽 · same notes as major pentatonic",
  },
  {
    id: "chinese",
    name: "Chinese",
    group: "world",
    intervals: [0, 4, 6, 7, 11],
    degrees: ["1", "3", "#4", "5", "7"],
    flavor: "Guitar-book Chinese pentatonic",
  },
  {
    id: "hirajoshi",
    name: "Hirajoshi",
    group: "world",
    intervals: [0, 2, 3, 7, 8],
    degrees: ["1", "2", "b3", "5", "b6"],
    flavor: "Japanese",
  },
  {
    id: "insen",
    name: "Insen",
    group: "world",
    intervals: [0, 1, 5, 7, 10],
    degrees: ["1", "b2", "4", "5", "b7"],
    flavor: "Japanese In scale",
  },
  {
    id: "kumoi",
    name: "Kumoi",
    group: "world",
    intervals: [0, 2, 3, 7, 9],
    degrees: ["1", "2", "b3", "5", "6"],
    flavor: "Japanese",
  },
  {
    id: "iwato",
    name: "Iwato",
    group: "world",
    intervals: [0, 1, 5, 6, 10],
    degrees: ["1", "b2", "4", "b5", "b7"],
    flavor: "Japanese",
  },
  {
    id: "pelog",
    name: "Pelog",
    group: "world",
    intervals: [0, 1, 3, 7, 8],
    degrees: ["1", "b2", "b3", "5", "b6"],
    flavor: "Balinese (12-TET sketch)",
  },
  {
    id: "egyptian",
    name: "Egyptian",
    group: "world",
    intervals: [0, 2, 5, 7, 10],
    degrees: ["1", "2", "4", "5", "b7"],
    flavor: "Suspended pentatonic",
  },
  {
    id: "wholeTone",
    name: "Whole tone",
    group: "world",
    intervals: [0, 2, 4, 6, 8, 10],
    degrees: ["1", "2", "3", "#4", "#5", "#6"],
    flavor: "Dreamy / impressionist",
  },
  {
    id: "hwDim",
    name: "Half-whole dim",
    group: "world",
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    degrees: ["1", "b2", "#2", "3", "#4", "5", "6", "b7"],
    flavor: "Jazz diminished",
  },
  {
    id: "enigmatic",
    name: "Enigmatic",
    group: "world",
    intervals: [0, 1, 4, 6, 8, 10, 11],
    degrees: ["1", "b2", "3", "#4", "#5", "#6", "7"],
    flavor: "Verdi’s enigmatic",
  },
];

export interface TuningDef {
  id: string;
  name: string;
  midi: number[];
}

export const TUNINGS: TuningDef[] = [
  { id: "standard", name: "Standard EADGBE", midi: [40, 45, 50, 55, 59, 64] },
  { id: "dropD", name: "Drop D", midi: [38, 45, 50, 55, 59, 64] },
  { id: "dadgad", name: "DADGAD", midi: [38, 45, 50, 55, 57, 62] },
  { id: "openG", name: "Open G", midi: [38, 43, 50, 55, 59, 62] },
  { id: "eb", name: "Half step down", midi: [39, 44, 49, 54, 58, 63] },
];

export const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

export interface ProgressionDef {
  id: string;
  name: string;
  vibe: string;
  numerals: string[];
  mode: "major" | "minor";
}

export const PROGRESSIONS: ProgressionDef[] = [
  { id: "pop", name: "I–V–vi–IV", vibe: "Pop anthem", numerals: ["I", "V", "vi", "IV"], mode: "major" },
  { id: "sensitive", name: "vi–IV–I–V", vibe: "Emotional pop", numerals: ["vi", "IV", "I", "V"], mode: "major" },
  { id: "fifties", name: "I–vi–IV–V", vibe: "50s doo-wop", numerals: ["I", "vi", "IV", "V"], mode: "major" },
  { id: "classic", name: "I–IV–V", vibe: "Classic rock", numerals: ["I", "IV", "V"], mode: "major" },
  { id: "blues12", name: "12-bar blues", vibe: "Blues", numerals: ["I7", "I7", "I7", "I7", "IV7", "IV7", "I7", "I7", "V7", "IV7", "I7", "V7"], mode: "major" },
  { id: "twoFiveOne", name: "ii–V–I", vibe: "Jazz turnaround", numerals: ["ii", "V", "I"], mode: "major" },
  { id: "minor251", name: "iiø–V–i", vibe: "Minor jazz", numerals: ["iiø7", "V7", "i"], mode: "minor" },
  { id: "canon", name: "Pachelbel", vibe: "Canon in D", numerals: ["I", "V", "vi", "iii", "IV", "I", "IV", "V"], mode: "major" },
  { id: "axis", name: "I–V–vi–iii–IV", vibe: "Ballad walk", numerals: ["I", "V", "vi", "iii", "IV", "I", "IV", "V"], mode: "major" },
  { id: "creep", name: "I–III–IV–iv", vibe: "Creep / Radiohead", numerals: ["I", "III", "IV", "iv"], mode: "major" },
  { id: "mixo", name: "I–bVII–IV", vibe: "Mixolydian rock", numerals: ["I", "bVII", "IV"], mode: "major" },
  { id: "andalusian", name: "i–bVII–bVI–V", vibe: "Andalusian cadence", numerals: ["i", "bVII", "bVI", "V"], mode: "minor" },
  { id: "hitme", name: "I–bVII–bVI–bVII", vibe: "Epic descent", numerals: ["I", "bVII", "bVI", "bVII"], mode: "major" },
  { id: "minorPop", name: "i–bVI–bIII–bVII", vibe: "Minor pop", numerals: ["i", "bVI", "bIII", "bVII"], mode: "minor" },
  { id: "country", name: "I–IV–I–V", vibe: "Country", numerals: ["I", "IV", "I", "V"], mode: "major" },
  { id: "rhythm", name: "I–vi–ii–V", vibe: "Rhythm changes A", numerals: ["I", "vi", "ii", "V"], mode: "major" },
  { id: "vamp", name: "i–bVII", vibe: "Modal vamp", numerals: ["i", "bVII"], mode: "minor" },
  { id: "sad", name: "vi–V–IV–V", vibe: "Hopeful sad", numerals: ["vi", "V", "IV", "V"], mode: "major" },
  { id: "folk", name: "I–V–IV–V", vibe: "Folk stomp", numerals: ["I", "V", "IV", "V"], mode: "major" },
  { id: "dreamy", name: "I–iii–IV–iv", vibe: "Dreamy shift", numerals: ["I", "iii", "IV", "iv"], mode: "major" },
];

const DEGREE_MAP: Record<string, number> = {
  I: 0,
  II: 2,
  III: 4,
  IV: 5,
  V: 7,
  VI: 9,
  VII: 11,
};

function qualityFromToken(raw: string, isLower: boolean): string {
  if (raw.includes("ø")) return "m7b5";
  if (/dim|°/.test(raw)) return "dim";
  if (/aug|\+/.test(raw)) return "aug";
  if (/maj7|Δ/.test(raw)) return "maj7";
  if (/sus4/.test(raw)) return "sus4";
  if (/sus2/.test(raw)) return "sus2";
  if (/m7/.test(raw) || (isLower && /7/.test(raw) && !/maj/.test(raw))) return "m7";
  if (/7/.test(raw)) return "7";
  if (isLower) return "m";
  return "";
}

export function chordFromNumeral(keyIndex: number, numeral: string, pref: AccidentalPref): string {
  const token = numeral.trim();
  const acc = token.startsWith("b") ? -1 : token.startsWith("#") ? 1 : 0;
  const body = token.replace(/^[b#]/, "");
  const roman = body.match(/^[IViv]+|ø/)?.[0] ?? body;
  const romanLetters = roman.replace("ø", "");
  const isLower = romanLetters === romanLetters.toLowerCase();
  const upper = romanLetters.toUpperCase();
  const degree = DEGREE_MAP[upper];
  if (degree === undefined) return token;
  const namePref: AccidentalPref = acc < 0 ? "flat" : acc > 0 ? "sharp" : pref;
  const root = noteName(keyIndex + degree + acc, namePref);
  const quality = qualityFromToken(body, isLower);
  return `${root}${quality}`;
}

export function chordsForProgression(prog: ProgressionDef, keyIndex: number): string[] {
  const pref: AccidentalPref = prefersFlats(keyIndex, prog.mode === "minor" ? "minor" : "major") ? "flat" : "sharp";
  return prog.numerals.map((n) => chordFromNumeral(keyIndex, n, pref));
}

/** Open/common guitar shapes, low E to high e. -1 mute, 0 open. */
export const CHORD_SHAPES: Record<string, number[]> = {
  C: [-1, 3, 2, 0, 1, 0],
  Cmaj7: [-1, 3, 2, 0, 0, 0],
  C7: [-1, 3, 2, 3, 1, 0],
  Cm: [-1, 3, 5, 5, 4, 3],
  D: [-1, -1, 0, 2, 3, 2],
  Dm: [-1, -1, 0, 2, 3, 1],
  D7: [-1, -1, 0, 2, 1, 2],
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  E7: [0, 2, 0, 1, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  Fm: [1, 3, 3, 1, 1, 1],
  G: [3, 2, 0, 0, 0, 3],
  G7: [3, 2, 0, 0, 0, 1],
  Gm: [3, 5, 5, 3, 3, 3],
  A: [-1, 0, 2, 2, 2, 0],
  Am: [-1, 0, 2, 2, 1, 0],
  A7: [-1, 0, 2, 0, 2, 0],
  Am7: [-1, 0, 2, 0, 1, 0],
  B: [-1, 2, 4, 4, 4, 2],
  Bm: [-1, 2, 4, 4, 3, 2],
  B7: [-1, 2, 1, 2, 0, 2],
  Bb: [-1, 1, 3, 3, 3, 1],
  Bbm: [-1, 1, 3, 3, 2, 1],
};

const ENHARMONIC: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
};

export function shapeForChord(chord: string): number[] | null {
  if (CHORD_SHAPES[chord]) return CHORD_SHAPES[chord]!;
  const m = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return null;
  const alt = ENHARMONIC[m[1]!];
  if (alt && CHORD_SHAPES[alt + m[2]]) return CHORD_SHAPES[alt + m[2]!]!;
  return null;
}

export const CHORD_REGEX =
  /\b([A-G](?:#|b)?)(maj7|maj|min|m7b5|m7|m|7sus4|sus4|sus2|dim|aug|add9|add11|13|11|9|7|6)?(\/[A-G](?:#|b)?)?\b/g;

export function extractChords(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(new RegExp(CHORD_REGEX.source, "g"))) {
    const chord = match[0];
    if (!seen.has(chord)) {
      seen.add(chord);
      found.push(chord);
    }
  }
  return found;
}

export function likelyChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const chords = [...trimmed.matchAll(new RegExp(CHORD_REGEX.source, "g"))];
  if (chords.length === 0) return false;
  const chordChars = chords.reduce((n, m) => n + m[0].length, 0);
  return chordChars / trimmed.replace(/\s/g, "").length > 0.45 || chords.length >= 2;
}

export function scaleNotes(keyIndex: number, scale: ScaleDef): number[] {
  return scale.intervals.map((iv) => (keyIndex + iv) % 12);
}

export function degreeAt(keyIndex: number, scale: ScaleDef, pitchClass: number): string | null {
  const rel = (pitchClass - keyIndex + 12) % 12;
  const idx = scale.intervals.indexOf(rel);
  return idx === -1 ? null : scale.degrees[idx]!;
}

const MAJOR_STEPS: Record<string, number> = { "1": 0, "2": 2, "3": 4, "4": 5, "5": 7, "6": 9, "7": 11 };

/** Spell a scale degree with the accidental the degree asks for (C Hungarian minor → Eb and F#). */
export function noteNameForDegree(keyIndex: number, degree: string): string {
  const match = degree.match(/^(b+|#+)?([1-7])$/);
  if (!match) return noteName(keyIndex, "sharp");
  const acc = match[1] ?? "";
  const step = MAJOR_STEPS[match[2]!] ?? 0;
  const flats = (acc.match(/b/g) ?? []).length;
  const sharps = (acc.match(/#/g) ?? []).length;
  const pc = (keyIndex + step - flats + sharps + 12) % 12;
  if (sharps) return noteName(pc, "sharp");
  if (flats) return noteName(pc, "flat");
  return noteName(pc, prefersFlats(keyIndex, "major") ? "flat" : "sharp");
}
