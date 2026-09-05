export type Shape = number[];

export interface Voicing {
  name: string;
  family: string;
  shape: Shape;
  position: number;
}

export const CHORD_QUALITIES: { id: string; name: string }[] = [
  { id: "", name: "maj" },
  { id: "m", name: "min" },
  { id: "7", name: "7" },
  { id: "m7", name: "m7" },
  { id: "maj7", name: "maj7" },
  { id: "6", name: "6" },
  { id: "m6", name: "m6" },
  { id: "sus2", name: "sus2" },
  { id: "sus4", name: "sus4" },
  { id: "7sus4", name: "7sus4" },
  { id: "9", name: "9" },
  { id: "add9", name: "add9" },
  { id: "dim", name: "dim" },
  { id: "aug", name: "aug" },
  { id: "m7b5", name: "m7b5" },
];

const OPEN_PC = [4, 9, 2, 7, 11, 4];

interface Tmpl {
  family: string;
  qualities: string[];
  build: (n: number) => Shape;
  rootString: number;
  rootFret: (n: number) => number;
}

const TEMPLATES: Tmpl[] = [
  { family: "E-shape", qualities: [""], build: (n) => [n, n + 2, n + 2, n + 1, n, n], rootString: 0, rootFret: (n) => n },
  { family: "A-shape", qualities: [""], build: (n) => [-1, n, n + 2, n + 2, n + 2, n], rootString: 1, rootFret: (n) => n },
  { family: "C-shape", qualities: [""], build: (n) => [-1, n + 3, n + 2, n, n + 1, n], rootString: 1, rootFret: (n) => n + 3 },
  { family: "G-shape", qualities: [""], build: (n) => [n + 3, n + 2, n, n, n, n + 3], rootString: 0, rootFret: (n) => n + 3 },
  { family: "D-shape", qualities: [""], build: (n) => [-1, -1, n, n + 2, n + 3, n + 2], rootString: 2, rootFret: (n) => n },
  { family: "Em-shape", qualities: ["m"], build: (n) => [n, n + 2, n + 2, n, n, n], rootString: 0, rootFret: (n) => n },
  { family: "Am-shape", qualities: ["m"], build: (n) => [-1, n, n + 2, n + 2, n + 1, n], rootString: 1, rootFret: (n) => n },
  { family: "Dm-shape", qualities: ["m"], build: (n) => [-1, -1, n, n + 2, n + 3, n + 1], rootString: 2, rootFret: (n) => n },
  { family: "E7-shape", qualities: ["7"], build: (n) => [n, n + 2, n, n + 1, n, n], rootString: 0, rootFret: (n) => n },
  { family: "A7-shape", qualities: ["7"], build: (n) => [-1, n, n + 2, n, n + 2, n], rootString: 1, rootFret: (n) => n },
  { family: "C7-shape", qualities: ["7"], build: (n) => [-1, n + 3, n + 2, n + 3, n + 1, n], rootString: 1, rootFret: (n) => n + 3 },
  { family: "D7-shape", qualities: ["7"], build: (n) => [-1, -1, n, n + 2, n + 1, n + 2], rootString: 2, rootFret: (n) => n },
  { family: "G7-shape", qualities: ["7"], build: (n) => [n + 3, n + 2, n, n, n, n + 1], rootString: 0, rootFret: (n) => n + 3 },
  { family: "B7-shape", qualities: ["7"], build: (n) => [-1, n + 2, n + 1, n + 2, n, n + 2], rootString: 1, rootFret: (n) => n + 2 },
  { family: "Em7-shape", qualities: ["m7"], build: (n) => [n, n + 2, n + 2, n, n + 3, n], rootString: 0, rootFret: (n) => n },
  { family: "Am7-shape", qualities: ["m7"], build: (n) => [-1, n, n + 2, n, n + 1, n], rootString: 1, rootFret: (n) => n },
  { family: "Dm7-shape", qualities: ["m7"], build: (n) => [-1, -1, n, n + 2, n + 1, n + 1], rootString: 2, rootFret: (n) => n },
  { family: "Emaj7-shape", qualities: ["maj7"], build: (n) => [n, n + 2, n + 1, n + 1, n, n], rootString: 0, rootFret: (n) => n },
  { family: "Amaj7-shape", qualities: ["maj7"], build: (n) => [-1, n, n + 2, n + 1, n + 2, n], rootString: 1, rootFret: (n) => n },
  { family: "Cmaj7-shape", qualities: ["maj7"], build: (n) => [-1, n + 3, n + 2, n, n, n], rootString: 1, rootFret: (n) => n + 3 },
  { family: "E6-shape", qualities: ["6"], build: (n) => [n, n + 2, n + 2, n + 1, n + 2, n], rootString: 0, rootFret: (n) => n },
  { family: "A6-shape", qualities: ["6"], build: (n) => [-1, n, n + 2, n + 2, n + 2, n + 2], rootString: 1, rootFret: (n) => n },
  { family: "Em6-shape", qualities: ["m6"], build: (n) => [n, n + 2, n + 2, n, n + 2, n], rootString: 0, rootFret: (n) => n },
  { family: "Am6-shape", qualities: ["m6"], build: (n) => [-1, n, n + 2, n + 2, n + 1, n + 2], rootString: 1, rootFret: (n) => n },
  { family: "Esus2-shape", qualities: ["sus2"], build: (n) => [n, n + 2, n + 4, n + 4, n, n], rootString: 0, rootFret: (n) => n },
  { family: "Asus2-shape", qualities: ["sus2"], build: (n) => [-1, n, n + 2, n + 2, n, n], rootString: 1, rootFret: (n) => n },
  { family: "Dsus2-shape", qualities: ["sus2"], build: (n) => [-1, -1, n, n + 2, n + 3, n], rootString: 2, rootFret: (n) => n },
  { family: "Esus4-shape", qualities: ["sus4"], build: (n) => [n, n + 2, n + 2, n + 2, n, n], rootString: 0, rootFret: (n) => n },
  { family: "Asus4-shape", qualities: ["sus4"], build: (n) => [-1, n, n + 2, n + 2, n + 3, n], rootString: 1, rootFret: (n) => n },
  { family: "Dsus4-shape", qualities: ["sus4"], build: (n) => [-1, -1, n, n + 2, n + 3, n + 3], rootString: 2, rootFret: (n) => n },
  { family: "E7sus4-shape", qualities: ["7sus4"], build: (n) => [n, n + 2, n + 2, n + 2, n, n], rootString: 0, rootFret: (n) => n },
  { family: "A7sus4-shape", qualities: ["7sus4"], build: (n) => [-1, n, n + 2, n, n + 3, n + 3], rootString: 1, rootFret: (n) => n },
  { family: "D7sus4-shape", qualities: ["7sus4"], build: (n) => [-1, -1, n, n + 2, n, n + 3], rootString: 2, rootFret: (n) => n },
  { family: "E9-shape", qualities: ["9"], build: (n) => [n, n + 2, n, n + 1, n, n + 2], rootString: 0, rootFret: (n) => n },
  { family: "Cadd9-shape", qualities: ["add9"], build: (n) => [-1, n + 3, n + 2, n, n + 3, n], rootString: 1, rootFret: (n) => n + 3 },
  { family: "Eadd9-shape", qualities: ["add9"], build: (n) => [n, n + 2, n + 2, n + 1, n, n + 2], rootString: 0, rootFret: (n) => n },
  { family: "Edim-shape", qualities: ["dim"], build: (n) => [n, n + 1, n + 2, n, n + 1, n], rootString: 0, rootFret: (n) => n },
  { family: "Ddim-shape", qualities: ["dim"], build: (n) => [-1, -1, n, n + 1, n + 3, n + 1], rootString: 2, rootFret: (n) => n },
  { family: "Eaug-shape", qualities: ["aug"], build: (n) => [n, n + 3, n + 2, n + 1, n + 1, n], rootString: 0, rootFret: (n) => n },
  { family: "Caug-shape", qualities: ["aug"], build: (n) => [-1, n + 3, n + 2, n + 1, n + 1, n], rootString: 1, rootFret: (n) => n + 3 },
  { family: "Em7b5-shape", qualities: ["m7b5"], build: (n) => [n, n + 1, n + 2, n, n + 3, n], rootString: 0, rootFret: (n) => n },
  { family: "Am7b5-shape", qualities: ["m7b5"], build: (n) => [-1, n, n + 1, n, n + 1, n], rootString: 1, rootFret: (n) => n },
];

function playable(shape: Shape): boolean {
  if (shape.some((f) => f < -1 || f > 15)) return false;
  const sounding = shape.filter((f) => f >= 0);
  if (sounding.length < 3) return false;
  return Math.max(...sounding) - Math.min(...sounding) <= 5;
}

function keyOf(shape: Shape): string {
  return shape.join(",");
}

export function voicingsFor(rootPc: number, quality: string): Voicing[] {
  const found: Voicing[] = [];
  const seen = new Set<string>();
  for (const tmpl of TEMPLATES) {
    if (!tmpl.qualities.includes(quality)) continue;
    for (let n = 0; n <= 12; n++) {
      const shape = tmpl.build(n);
      if (!playable(shape)) continue;
      const pc = (OPEN_PC[tmpl.rootString]! + tmpl.rootFret(n) + 120) % 12;
      if (pc !== rootPc) continue;
      const k = keyOf(shape);
      if (seen.has(k)) continue;
      seen.add(k);
      const pressed = shape.filter((f) => f > 0);
      const pos = pressed.length ? Math.min(...pressed) : 0;
      const open = shape.some((f) => f === 0) && Math.max(...shape) <= 3;
      found.push({
        family: tmpl.family,
        shape,
        position: pos,
        name: open ? "Open" : `${tmpl.family} · fret ${Math.max(pos, n)}`,
      });
    }
  }
  found.sort((a, b) => {
    const aOpen = a.name === "Open" ? 0 : 1;
    const bOpen = b.name === "Open" ? 0 : 1;
    if (aOpen !== bOpen) return aOpen - bOpen;
    return a.position - b.position;
  });
  return found.slice(0, 8);
}

export function shapeToTab(shape: Shape): string {
  const names = ["e", "B", "G", "D", "A", "E"];
  return [...shape]
    .reverse()
    .map((fret, i) => {
      const mark = fret < 0 ? "x" : String(fret);
      const pad = mark.length === 1 ? `-${mark}-` : mark;
      return `${names[i]}|---${pad}---`;
    })
    .join("\n");
}

export function chordDiagramSvg(shape: Shape, title = ""): string {
  const pressed = shape.filter((f) => f > 0);
  const start = pressed.length ? Math.min(...pressed) : 1;
  const windowStart = start > 4 ? start - 1 : 1;
  const x0 = 22;
  const y0 = 28;
  const gap = 16;
  const fretH = 22;
  const ink = "#2b2118";
  const dots = shape
    .map((fret, string) => {
      const x = x0 + string * gap;
      if (fret < 0) {
        return `<text x="${x}" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="${ink}">×</text>`;
      }
      if (fret === 0) {
        return `<circle cx="${x}" cy="16" r="5" fill="none" stroke="${ink}" stroke-width="2"/>`;
      }
      const y = y0 + (fret - windowStart) * fretH + fretH / 2;
      return `<circle cx="${x}" cy="${y}" r="6.5" fill="#c45c26"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="9" font-weight="700" fill="#f4ebd7">${fret}</text>`;
    })
    .join("");
  const lines = [0, 1, 2, 3, 4]
    .map((i) => {
      const y = y0 + i * fretH;
      const w = i === 0 && windowStart === 1 ? 4 : 1.4;
      return `<line x1="${x0}" y1="${y}" x2="${x0 + 5 * gap}" y2="${y}" stroke="${ink}" stroke-width="${w}"/>`;
    })
    .join("");
  const verts = [0, 1, 2, 3, 4, 5]
    .map((i) => `<line x1="${x0 + i * gap}" y1="${y0}" x2="${x0 + i * gap}" y2="${y0 + 4 * fretH}" stroke="${ink}" stroke-width="1.4"/>`)
    .join("");
  const pos = windowStart > 1 ? `<text x="${x0 + 5 * gap + 8}" y="${y0 + 16}" font-size="11" font-weight="700" fill="${ink}">${windowStart}</text>` : "";
  const label = title ? `<text x="62" y="12" text-anchor="middle" font-size="11" font-weight="700" fill="${ink}">${title}</text>` : "";
  return `<div class="diagram"><svg viewBox="0 0 124 132">${label}<rect x="4" y="4" width="116" height="124" rx="10" fill="#f4ebd7"/>${lines}${verts}${dots}${pos}</svg></div>`;
}

const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export function noteIndex(note: string): number {
  const i = NOTES_SHARP.indexOf(note);
  if (i >= 0) return i;
  return Math.max(0, NOTES_FLAT.indexOf(note));
}

export function normalizeQuality(q: string): string {
  const trimmed = q.replace(/\/.*$/, "");
  if (trimmed === "min" || trimmed === "m") return "m";
  if (trimmed === "maj" || trimmed === "major") return "";
  if (trimmed === "sus") return "sus4";
  return trimmed;
}

export function voicingForSymbol(chord: string): Voicing | undefined {
  const m = chord.trim().match(/^([A-G][#b]?)(.*)$/);
  if (!m) return undefined;
  const rootPc = noteIndex(m[1]!);
  const quality = normalizeQuality(m[2] ?? "");
  const fallbacks = quality === "7sus4" ? ["7sus4", "sus4"] : [quality];
  for (const q of fallbacks) {
    const found = voicingsFor(rootPc, q)[0];
    if (found) return found;
  }
  return undefined;
}

export function diagramForSymbol(chord: string): string {
  const voicing = voicingForSymbol(chord);
  return chordDiagramSvg(voicing?.shape ?? [-1, -1, -1, -1, -1, -1], chord);
}
