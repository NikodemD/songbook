import { h } from "../dom";
import { playChord, playProgression } from "../audio";
import { KEYS, PROGRESSIONS, chordsForProgression, noteName, prefersFlats, type AccidentalPref } from "../theory";
import { CHORD_QUALITIES, diagramForSymbol, shapeToTab, voicingsFor, chordDiagramSvg } from "../voicings";

type Mode = "builder" | "progressions";

export function renderProgressions(root: HTMLElement): void {
  let mode = (localStorage.getItem("songbook-chords-mode") as Mode) || "builder";
  let key = Number(localStorage.getItem("songbook-prog-key") ?? 0);
  let selected = localStorage.getItem("songbook-prog-id") ?? PROGRESSIONS[0]!.id;
  let rootPc = Number(localStorage.getItem("songbook-chord-root") ?? 0);
  let quality = localStorage.getItem("songbook-chord-quality") ?? "";

  const paint = () => {
    localStorage.setItem("songbook-chords-mode", mode);
    root.innerHTML = h`
      <div>
        <div class="row" data-mode></div>
        <div data-body></div>
      </div>
    `;
    fillMode(root.querySelector("[data-mode]")!);
    const body = root.querySelector<HTMLElement>("[data-body]")!;
    if (mode === "builder") paintBuilder(body);
    else paintProgressions(body);
  };

  const fillMode = (row: Element) => {
    for (const item of [
      { id: "builder" as const, name: "Builder" },
      { id: "progressions" as const, name: "Progressions" },
    ]) {
      const btn = document.createElement("button");
      btn.className = "chip" + (mode === item.id ? " active" : "");
      btn.textContent = item.name;
      btn.addEventListener("click", () => {
        mode = item.id;
        paint();
      });
      row.append(btn);
    }
  };

  const paintBuilder = (body: HTMLElement) => {
    const pref: AccidentalPref = prefersFlats(rootPc, quality === "m" ? "minor" : "major") ? "flat" : "sharp";
    const symbol = `${noteName(rootPc, pref)}${quality}`;
    const voicings = voicingsFor(rootPc, quality);
    localStorage.setItem("songbook-chord-root", String(rootPc));
    localStorage.setItem("songbook-chord-quality", quality);

    body.innerHTML = h`
      <p class="muted">Pick a chord. Each variation shows a diagram and a tab.</p>
      <div class="row" data-roots></div>
      <div class="row" style="margin-top:8px" data-qualities></div>
      <div class="panel">
        <h2>${symbol}</h2>
        <p class="muted">${voicings.length ? `${voicings.length} shapes` : "No guitar shapes for this quality yet"}</p>
      </div>
      <div class="voicing-list" data-voicings></div>
    `;

    fillChips(
      body.querySelector("[data-roots]")!,
      KEYS,
      (k) => noteName(k.index, pref),
      rootPc,
      (k) => {
        rootPc = k.index;
        paint();
      },
      (k) => k.index,
    );
    fillChips(
      body.querySelector("[data-qualities]")!,
      CHORD_QUALITIES,
      (q) => q.name,
      quality,
      (q) => {
        quality = q.id;
        paint();
      },
      (q) => q.id,
    );

    const list = body.querySelector("[data-voicings]")!;
    for (const v of voicings) {
      const card = document.createElement("button");
      card.className = "voicing-card";
      card.innerHTML = `
        <div class="voicing-head">${v.name}</div>
        ${chordDiagramSvg(v.shape)}
        <pre class="chord-tab">${shapeToTab(v.shape)}</pre>
      `;
      card.addEventListener("click", () => playChord(symbol));
      list.append(card);
    }
  };

  const paintProgressions = (body: HTMLElement) => {
    const pref = prefersFlats(key, "major") ? "flat" : "sharp";
    const prog = PROGRESSIONS.find((p) => p.id === selected) ?? PROGRESSIONS[0]!;
    const chords = chordsForProgression(prog, key);
    localStorage.setItem("songbook-prog-key", String(key));
    localStorage.setItem("songbook-prog-id", selected);

    body.innerHTML = h`
      <p class="muted">Pick a key, then tap a progression. Chords update instantly.</p>
      <div class="row" data-keys></div>
      <div class="panel">
        <p class="vibe" style="color:var(--gold);letter-spacing:.08em;text-transform:uppercase;font-size:.72rem">${prog.vibe}</p>
        <h2>${prog.name}</h2>
        <p class="muted">In ${noteName(key, pref)} ${prog.mode}</p>
        <div class="chords" style="margin:10px 0 14px">
          ${chords.map((c) => `<button class="chord-pill" data-play="${c}">${c}</button>`).join("")}
        </div>
        <div class="diagrams">${chords.map((c) => diagramForSymbol(c)).join("")}</div>
        <div class="btn-row">
          <button class="btn" data-act="play">Play progression</button>
        </div>
      </div>
      <div class="prog-list" style="margin-top:12px" data-list></div>
    `;

    fillChips(
      body.querySelector("[data-keys]")!,
      KEYS,
      (k) => noteName(k.index, pref),
      key,
      (k) => {
        key = k.index;
        paint();
      },
      (k) => k.index,
    );

    const list = body.querySelector("[data-list]")!;
    for (const item of PROGRESSIONS) {
      const cs = chordsForProgression(item, key);
      const card = document.createElement("button");
      card.className = "prog-card" + (item.id === selected ? " active" : "");
      card.innerHTML = h`
        <div class="vibe">${item.vibe}</div>
        <h3>${item.name}</h3>
        <div class="chords">${cs.map((c) => `<span class="chord-pill">${c}</span>`).join("")}</div>
      `;
      card.addEventListener("click", () => {
        selected = item.id;
        paint();
      });
      list.append(card);
    }

    body.querySelectorAll<HTMLButtonElement>("[data-play]").forEach((btn) => {
      btn.addEventListener("click", () => playChord(btn.dataset.play ?? "C"));
    });
    body.querySelector("[data-act=play]")?.addEventListener("click", () => {
      void playProgression(chords, 88);
    });
  };

  paint();
}

function fillChips<T>(
  row: Element,
  items: T[],
  label: (item: T) => string,
  active: string | number,
  onPick: (item: T) => void,
  id: (item: T) => string | number,
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
