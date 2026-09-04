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
      const pos = Math.min(...shape.filter((f) => f > 0), 0);
      const open = shape.every((f) => f <= 3) && shape.some((f) => f === 0);
      found.push({
        family: tmpl.family,
        shape,
        position: pos,
        name: open && Math.max(...shape) <= 3 ? "Open" : `${tmpl.family} · fret ${Math.max(pos, n)}`,
      });
    }
  }
  found.sort((a, b) => a.position - b.position);
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
  const dots = shape
    .map((fret, string) => {
      if (fret < 0) return "";
      const x = 10 + string * 10;
      if (fret === 0) return `<circle cx="${x}" cy="8" r="3" fill="none" stroke="#2b2118" stroke-width="1.4"/>`;
      const y = 14 + (fret - windowStart) * 14 + 7;
      return `<circle cx="${x}" cy="${y}" r="4.2" fill="#2b2118"/>`;
    })
    .join("");
  const mutes = shape
    .map((fret, string) =>
      fret < 0 ? `<text x="${10 + string * 10}" y="10" text-anchor="middle" font-size="8">x</text>` : "",
    )
    .join("");
  const lines = [0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<line x1="10" y1="${14 + i * 14}" x2="60" y2="${14 + i * 14}" stroke="#2b2118" stroke-width="${i === 0 && windowStart === 1 ? 3 : 1}"/>`,
    )
    .join("");
  const verts = [0, 1, 2, 3, 4, 5]
    .map((i) => `<line x1="${10 + i * 10}" y1="14" x2="${10 + i * 10}" y2="70" stroke="#2b2118" stroke-width="1"/>`)
    .join("");
  const label = title ? `<strong>${title}</strong>` : "";
  return `<div class="diagram">${label}<svg viewBox="0 0 70 90">${lines}${verts}${mutes}${dots}${
    windowStart > 1 ? `<text x="66" y="26" font-size="8">${windowStart}</text>` : ""
  }</svg></div>`;
}
