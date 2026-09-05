import { h } from "../dom";
import {
  SCALES,
  SCALE_GROUPS,
  TUNINGS,
  KEYS,
  type ScaleDef,
  type ScaleGroup,
  type AccidentalPref,
  noteName,
  noteNameForDegree,
  prefersFlats,
  scaleNotes,
  degreeAt,
} from "../theory";

const FRETS = 12;
const STORAGE_KEY = "songbook-scales";

interface ScaleState {
  key: number;
  scaleId: string;
  tuningId: string;
  labels: "notes" | "degrees";
  group: ScaleGroup;
}

function load(): ScaleState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ScaleState>;
      const scale = SCALES.find((s) => s.id === parsed.scaleId);
      return {
        key: parsed.key ?? 0,
        scaleId: parsed.scaleId ?? "minorPent",
        tuningId: parsed.tuningId ?? "standard",
        labels: parsed.labels === "degrees" ? "degrees" : "notes",
        group: parsed.group ?? scale?.group ?? "core",
      };
    }
  } catch {
    /* ignore */
  }
  return { key: 0, scaleId: "minorPent", tuningId: "standard", labels: "notes", group: "core" };
}

function save(state: ScaleState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function renderScales(root: HTMLElement): void {
  const state = load();

  const paint = () => {
    const scale = SCALES.find((s) => s.id === state.scaleId) ?? SCALES[0]!;
    const tuning = TUNINGS.find((t) => t.id === state.tuningId) ?? TUNINGS[0]!;
    const pref: AccidentalPref = prefersFlats(state.key, scale.id) ? "flat" : "sharp";
    const pitches = new Set(scaleNotes(state.key, scale));
    const visible = SCALES.filter((s) => s.group === state.group);
    save(state);

    root.innerHTML = h`
      <div>
        <div class="row" data-row="keys"></div>
        <div class="row" style="margin-top:8px" data-row="groups"></div>
        <div class="row" style="margin-top:8px" data-row="scales"></div>
        <div class="panel">
          <h2>${noteName(state.key, pref)} ${scale.name}</h2>
          <p class="muted">${scale.flavor ? `${scale.flavor} · ` : ""}${scale.degrees.join(" · ")}</p>
          <p class="muted">${tuning.name}</p>
          <button type="button" class="fret-wrap compact" data-expand aria-label="Expand fretboard">
            ${fretboardHtml(tuning.midi, pitches, state.key, scale, pref, state.labels, "horizontal")}
            <span class="fret-hint">Tap to expand · turn the phone sideways</span>
          </button>
          <div class="legend">
            <span><i style="background:var(--root)"></i>Root</span>
            <span><i style="background:#f3ead6"></i>Scale tone</span>
            ${scale.id === "blues" ? `<span><i style="background:#c9a0ff"></i>Blue note</span>` : ""}
          </div>
          <div class="btn-row">
            <button class="btn ghost" data-act="labels">${state.labels === "notes" ? "Show degrees" : "Show notes"}</button>
          </div>
        </div>
        <div class="row" style="margin-top:12px" data-row="tunings"></div>
      </div>
    `;

    fillChips(root.querySelector("[data-row=keys]")!, KEYS, (k) => noteName(k.index, pref), state.key, (k) => {
      state.key = k.index;
      paint();
    });

    fillChips(
      root.querySelector("[data-row=groups]")!,
      SCALE_GROUPS,
      (g) => g.name,
      state.group,
      (g) => {
        state.group = g.id;
        paint();
      },
      (g) => g.id,
    );

    fillChips(
      root.querySelector("[data-row=scales]")!,
      visible,
      (s) => s.name,
      state.scaleId,
      (s) => {
        state.scaleId = s.id;
        state.group = s.group;
        paint();
      },
      (s) => s.id,
    );

    fillChips(
      root.querySelector("[data-row=tunings]")!,
      TUNINGS,
      (t) => t.name,
      state.tuningId,
      (t) => {
        state.tuningId = t.id;
        paint();
      },
      (t) => t.id,
    );

    root.querySelector("[data-act=labels]")?.addEventListener("click", () => {
      state.labels = state.labels === "notes" ? "degrees" : "notes";
      paint();
    });

    root.querySelector("[data-expand]")?.addEventListener("click", () => {
      openFretOverlay(tuning.midi, pitches, state.key, scale, pref, state.labels);
    });
  };

  paint();
}

export function closeScaleOverlay(): void {
  document.querySelector(".fret-overlay")?.remove();
}

function openFretOverlay(
  midi: number[],
  pitches: Set<number>,
  key: number,
  scale: ScaleDef,
  pref: AccidentalPref,
  labels: "notes" | "degrees",
): void {
  closeScaleOverlay();
  const overlay = document.createElement("div");
  overlay.className = "fret-overlay";
  overlay.innerHTML = `
    <div class="fret-overlay-bar">
      <span>${noteName(key, pref)} ${scale.name}</span>
      <button type="button" class="btn ghost" data-close>Close</button>
    </div>
    <p class="rotate-hint">Turn your phone sideways</p>
    <div class="fret-stage">
      ${fretboardHtml(midi, pitches, key, scale, pref, labels, "expanded")}
    </div>
  `;
  overlay.querySelector("[data-close]")?.addEventListener("click", () => closeScaleOverlay());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeScaleOverlay();
  });
  document.body.append(overlay);
}

function fillChips<T>(
  row: Element,
  items: T[],
  label: (item: T) => string,
  active: string | number,
  onPick: (item: T) => void,
  id: (item: T) => string | number = (item) => (item as { index: number }).index,
): void {
  row.replaceChildren();
  for (const item of items) {
    const btn = document.createElement("button");
    btn.className = "chip" + (id(item) === active ? " active" : "");
    btn.textContent = label(item);
    btn.addEventListener("click", () => onPick(item));
    row.append(btn);
  }
}

function fretboardHtml(
  midi: number[],
  pitches: Set<number>,
  key: number,
  scale: ScaleDef,
  pref: AccidentalPref,
  labels: "notes" | "degrees",
  orientation: "horizontal" | "expanded",
): string {
  const cell = (openMidi: number, fret: number): string => {
    const pc = (openMidi + fret) % 12;
    const inlay = [3, 5, 7, 9, 12].includes(fret) ? " inlay-fret" : "";
    if (!pitches.has(pc)) {
      return `<div class="fret-cell ${fret === 0 ? "nut" : ""}${inlay}">${fret === 0 ? noteName(openMidi, pref) : ""}</div>`;
    }
    const rel = (pc - key + 12) % 12;
    const isRoot = rel === 0;
    const isBlue = scale.id === "blues" && rel === 6;
    const degree = degreeAt(key, scale, pc);
    const text =
      labels === "degrees" ? (degree ?? "") : degree ? noteNameForDegree(key, degree) : noteName(pc, pref);
    const cls = `dot${isRoot ? " root" : ""}${isBlue ? " blue" : ""}`;
    return `<div class="fret-cell ${fret === 0 ? "nut" : ""}${inlay}"><span class="${cls}">${text}</span></div>`;
  };

  const strings = [...midi].reverse();
  const rows = strings
    .map(
      (openMidi, i) =>
        `<div class="string-row" data-gauge="${i + 1}"><span class="string-wire"></span>${Array.from({ length: FRETS + 1 }, (_, fret) => cell(openMidi, fret)).join("")}</div>`,
    )
    .join("");
  const nums = [`<div class="fret-num"></div>`]
    .concat(Array.from({ length: FRETS }, (_, i) => `<div class="fret-num">${i + 1}</div>`))
    .join("");
  const inlays = [3, 5, 7, 9]
    .map((fret) => `<span class="inlay" style="grid-column:${fret + 1}"></span>`)
    .join("");
  return `<div class="fretboard ${orientation === "expanded" ? "expanded" : ""}"><div class="inlays" aria-hidden="true">${inlays}<span class="inlay double" style="grid-column:13"></span></div>${rows}<div class="fret-nums">${nums}</div></div>`;
}
