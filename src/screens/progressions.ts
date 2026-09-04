import { h } from "../dom";
import { playChord, playProgression } from "../audio";
import { KEYS, PROGRESSIONS, chordsForProgression, noteName, prefersFlats, shapeForChord } from "../theory";

export function renderProgressions(root: HTMLElement): void {
  let key = Number(localStorage.getItem("songbook-prog-key") ?? 0);
  let selected = localStorage.getItem("songbook-prog-id") ?? PROGRESSIONS[0]!.id;

  const paint = () => {
    const pref = prefersFlats(key, "major") ? "flat" : "sharp";
    const prog = PROGRESSIONS.find((p) => p.id === selected) ?? PROGRESSIONS[0]!;
    const chords = chordsForProgression(prog, key);
    localStorage.setItem("songbook-prog-key", String(key));
    localStorage.setItem("songbook-prog-id", selected);

    root.innerHTML = h`
      <div>
        <p class="muted">Pick a key, then tap a progression. Chords update instantly.</p>
        <div class="row" data-keys></div>
        <div class="panel">
          <p class="vibe" style="color:var(--gold);letter-spacing:.08em;text-transform:uppercase;font-size:.72rem">${prog.vibe}</p>
          <h2>${prog.name}</h2>
          <p class="muted">In ${noteName(key, pref)} ${prog.mode}</p>
          <div class="chords" style="margin:10px 0 14px">
            ${chords.map((c) => `<button class="chord-pill" data-play="${c}">${c}</button>`).join("")}
          </div>
          <div class="diagrams">${chords.map(diagramHtml).join("")}</div>
          <div class="btn-row">
            <button class="btn" data-act="play">Play progression</button>
          </div>
        </div>
        <div class="prog-list" style="margin-top:12px" data-list></div>
      </div>
    `;

    const keyRow = root.querySelector("[data-keys]")!;
    for (const k of KEYS) {
      const btn = document.createElement("button");
      btn.className = "chip" + (k.index === key ? " active" : "");
      btn.textContent = noteName(k.index, pref);
      btn.addEventListener("click", () => {
        key = k.index;
        paint();
      });
      keyRow.append(btn);
    }

    const list = root.querySelector("[data-list]")!;
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

    root.querySelectorAll<HTMLButtonElement>("[data-play]").forEach((btn) => {
      btn.addEventListener("click", () => playChord(btn.dataset.play ?? "C"));
    });
    root.querySelector("[data-act=play]")?.addEventListener("click", () => {
      void playProgression(chords, 88);
    });
  };

  paint();
}

function diagramHtml(chord: string): string {
  const shape = shapeForChord(chord);
  if (!shape) {
    return `<div class="diagram"><strong>${chord}</strong><p class="muted">no diagram</p></div>`;
  }
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
    .map((i) => `<line x1="10" y1="${14 + i * 14}" x2="60" y2="${14 + i * 14}" stroke="#2b2118" stroke-width="${i === 0 && windowStart === 1 ? 3 : 1}"/>`)
    .join("");
  const verts = [0, 1, 2, 3, 4, 5]
    .map((i) => `<line x1="${10 + i * 10}" y1="14" x2="${10 + i * 10}" y2="70" stroke="#2b2118" stroke-width="1"/>`)
    .join("");
  return `<div class="diagram"><strong>${chord}</strong><svg viewBox="0 0 70 90">${lines}${verts}${mutes}${dots}${
    windowStart > 1 ? `<text x="66" y="26" font-size="8">${windowStart}</text>` : ""
  }</svg></div>`;
}
