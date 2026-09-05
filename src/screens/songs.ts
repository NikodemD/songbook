import { h, escapeHtml } from "../dom";
import { extractChords, likelyChordLine, CHORD_REGEX } from "../theory";
import { deleteSong, getSong, listSongs, newId, saveSong, type Song } from "../storage";
import { importTabFromUrl } from "../importUrl";
import { isTabLine } from "../tabparse";
import { diagramForSymbol, shapeToTab, voicingForSymbol } from "../voicings";
import { playChord } from "../audio";

const SAMPLE_SONGS = [
  {
    id: "sample-wonderwall",
    url: "https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-27596",
    title: "Oasis – Wonderwall",
  },
  {
    id: "sample-300-mph",
    url: "https://tabs.ultimate-guitar.com/tab/the-white-stripes/300-mph-torrential-outpour-blues-chords-1028697",
    title: "The White Stripes – 300 M.P.H. Torrential Outpour Blues",
  },
  {
    id: "sample-bella-ciao",
    url: "https://tabs.ultimate-guitar.com/tab/misc-traditional/bella-ciao-chords-1839756",
    title: "Bella Ciao",
  },
];

type View = { mode: "list" } | { mode: "edit"; draft: Draft } | { mode: "read"; id: string };

interface Draft {
  id?: string;
  title: string;
  text: string;
  sourceUrl?: string;
  image?: Blob;
  status: string;
  progress: number;
}

let view: View = { mode: "list" };
let seedingSamples = false;
let chordPop: HTMLElement | null = null;

window.addEventListener("hashchange", closeChordPop);

export function renderSongs(root: HTMLElement): void {
  void paint(root);
}

async function paint(root: HTMLElement): Promise<void> {
  closeChordPop();
  if (view.mode === "list") {
    const songs = await listSongs();
    root.innerHTML = h`
      <div>
        <p class="muted">Scan a photo, paste a chord sheet, or import a public Ultimate Guitar link. Songs stay on this phone.</p>
        <input class="field" data-url placeholder="https://tabs.ultimate-guitar.com/…" inputmode="url" autocapitalize="off" autocomplete="off" />
        <div class="btn-row">
          <button class="btn" data-act="import">Import link</button>
          <button class="btn ghost" data-act="photo">Scan photo</button>
          <button class="btn ghost" data-act="paste">Paste text</button>
        </div>
        <input class="hidden-file" type="file" accept="image/*" data-file />
        <p class="muted" data-status></p>
        ${
          songs.length === 0
            ? `<div class="empty">No saved songs yet.</div>`
            : `<div class="prog-list" style="margin-top:14px">${songs
                .map(
                  (s) =>
                    `<button class="song-item" data-open="${s.id}"><span><strong>${escapeHtml(s.title)}</strong><div class="muted">${new Date(s.createdAt).toLocaleDateString()}</div></span><span class="muted">Open</span></button>`,
                )
                .join("")}</div>`
        }
      </div>
    `;
    root.querySelector("[data-act=photo]")?.addEventListener("click", () => {
      root.querySelector<HTMLInputElement>("[data-file]")?.click();
    });
    root.querySelector("[data-file]")?.addEventListener("change", (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) void startOcr(root, file);
    });
    root.querySelector("[data-act=paste]")?.addEventListener("click", () => {
      view = { mode: "edit", draft: { title: "Untitled song", text: "", status: "", progress: 0 } };
      void paint(root);
    });
    root.querySelector("[data-act=import]")?.addEventListener("click", () => void importLink(root));
    root.querySelector("[data-url]")?.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") void importLink(root);
    });
    root.querySelectorAll<HTMLButtonElement>("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        view = { mode: "read", id: btn.dataset.open! };
        void paint(root);
      });
    });
    void ensureSampleSongs(root);
    return;
  }

  if (view.mode === "read") {
    const song = await getSong(view.id);
    if (!song) {
      view = { mode: "list" };
      void paint(root);
      return;
    }
    root.innerHTML = h`
      <div>
        <button class="btn ghost" data-act="back">All songs</button>
        <div class="panel">
          <h2>${escapeHtml(song.title)}</h2>
          <p class="muted">${song.sourceUrl ? `<a class="source" href="${escapeHtml(song.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(hostOf(song.sourceUrl))}</a> · ` : ""}${chordHits(
            song.text
              .split("\n")
              .filter((line) => !isTabLine(line))
              .join("\n"),
          )}</p>
        </div>
        <div class="paper" style="margin-top:12px">${renderLyricHtml(song.text)}</div>
        <div class="btn-row">
          <button class="btn ghost" data-act="edit">Edit</button>
          <button class="btn danger" data-act="delete">Delete</button>
        </div>
      </div>
    `;
    root.querySelector("[data-act=back]")?.addEventListener("click", () => {
      view = { mode: "list" };
      void paint(root);
    });
    root.querySelector("[data-act=edit]")?.addEventListener("click", () => {
      view = {
        mode: "edit",
        draft: { id: song.id, title: song.title, text: song.text, sourceUrl: song.sourceUrl, image: song.image, status: "", progress: 0 },
      };
      void paint(root);
    });
    root.querySelector("[data-act=delete]")?.addEventListener("click", async () => {
      const sample = SAMPLE_SONGS.find((s) => s.id === song.id);
      if (sample) localStorage.setItem(seedFlag(sample.id), "1");
      await deleteSong(song.id);
      view = { mode: "list" };
      void paint(root);
    });
    bindChordHits(root);
    return;
  }

  const draft = view.draft;
  root.innerHTML = h`
    <div>
      <button class="btn ghost" data-act="back">Cancel</button>
      <label class="muted" style="display:block;margin-top:12px">Title</label>
      <input class="field" data-title value="${escapeHtml(draft.title)}" />
      ${
        draft.status
          ? `<div class="panel"><p>${escapeHtml(draft.status)}</p><div class="progress"><span style="width:${draft.progress}%"></span></div></div>`
          : ""
      }
      <label class="muted" style="display:block;margin-top:12px">Lyrics & chords</label>
      <textarea class="field" data-text>${escapeHtml(draft.text)}</textarea>
      <div class="paper" style="margin-top:12px">${draft.text ? renderLyricHtml(draft.text) : "<span class='muted'>Preview appears here</span>"}</div>
      <div class="btn-row">
        <button class="btn wide" data-act="save">Save song</button>
      </div>
    </div>
  `;
  root.querySelector("[data-act=back]")?.addEventListener("click", () => {
    view = { mode: "list" };
    void paint(root);
  });
  root.querySelector("[data-title]")?.addEventListener("input", (e) => {
    draft.title = (e.target as HTMLInputElement).value;
  });
  root.querySelector("[data-text]")?.addEventListener("input", (e) => {
    draft.text = (e.target as HTMLTextAreaElement).value;
    const preview = root.querySelector(".paper");
    if (preview) preview.innerHTML = renderLyricHtml(draft.text);
  });
  root.querySelector("[data-act=save]")?.addEventListener("click", async () => {
    const song: Song = {
      id: draft.id ?? newId(),
      title: draft.title.trim() || firstLine(draft.text) || "Untitled song",
      text: draft.text.trim(),
      sourceUrl: draft.sourceUrl?.trim() || undefined,
      createdAt: Date.now(),
      image: draft.image,
    };
    await saveSong(song);
    view = { mode: "read", id: song.id };
    void paint(root);
  });
}

async function importLink(root: HTMLElement): Promise<void> {
  const input = root.querySelector<HTMLInputElement>("[data-url]");
  const status = root.querySelector("[data-status]");
  const url = input?.value.trim() ?? "";
  if (!url) {
    if (status) status.textContent = "Paste a link first.";
    return;
  }
  if (status) status.textContent = "Reading that page…";
  try {
    const imported = await importTabFromUrl(url);
    view = {
      mode: "edit",
      draft: {
        title: imported.title,
        text: imported.tab,
        sourceUrl: imported.sourceUrl,
        status: "",
        progress: 0,
      },
    };
    await paint(root);
  } catch (err) {
    if (status) status.textContent = err instanceof Error ? err.message : "Import failed.";
  }
}

function seedFlag(id: string): string {
  return `songbook-seeded-${id}`;
}

async function ensureSampleSongs(root: HTMLElement): Promise<void> {
  if (seedingSamples) return;
  const pending: typeof SAMPLE_SONGS = [];
  for (const sample of SAMPLE_SONGS) {
    if (localStorage.getItem(seedFlag(sample.id)) === "1") continue;
    if (await getSong(sample.id)) {
      localStorage.setItem(seedFlag(sample.id), "1");
      continue;
    }
    pending.push(sample);
  }
  if (!pending.length) return;
  seedingSamples = true;
  const status = root.querySelector("[data-status]");
  try {
    for (const sample of pending) {
      if (status) status.textContent = `Adding ${sample.title}…`;
      const imported = await importTabFromUrl(sample.url);
      await saveSong({
        id: sample.id,
        title: sample.title,
        text: imported.tab,
        sourceUrl: imported.sourceUrl,
        createdAt: Date.now(),
      });
      localStorage.setItem(seedFlag(sample.id), "1");
    }
    if (view.mode === "list") await paint(root);
  } catch {
    const failed = pending.find((s) => localStorage.getItem(seedFlag(s.id)) !== "1");
    if (status) {
      status.textContent = failed
        ? `Could not add ${failed.title} automatically. Paste the Ultimate Guitar link and import.`
        : "Could not add that song automatically.";
    }
    const input = root.querySelector<HTMLInputElement>("[data-url]");
    if (input && !input.value && failed) input.value = failed.url;
  } finally {
    seedingSamples = false;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

async function startOcr(root: HTMLElement, file: File): Promise<void> {
  const draft: Draft = {
    title: file.name.replace(/\.[^.]+$/, ""),
    text: "",
    image: file,
    status: "Reading the photo…",
    progress: 8,
  };
  view = { mode: "edit", draft };
  await paint(root);

  try {
    const prepared = await prepareImage(file);
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && typeof m.progress === "number") {
          draft.progress = Math.round(m.progress * 100);
          draft.status = `Reading the photo… ${draft.progress}%`;
          const bar = root.querySelector<HTMLElement>(".progress > span");
          const label = root.querySelector(".panel p");
          if (bar) bar.style.width = `${draft.progress}%`;
          if (label) label.textContent = draft.status;
        }
      },
    });
    const result = await worker.recognize(prepared);
    await worker.terminate();
    draft.text = cleanupOcr(result.data.text);
    draft.title = firstLine(draft.text) || draft.title;
    draft.status = "";
    await paint(root);
  } catch (err) {
    draft.status = err instanceof Error ? err.message : "Could not read that image. Paste the lyrics instead.";
    await paint(root);
  }
}

function firstLine(text: string): string {
  return text.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
}

function cleanupOcr(text: string): string {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[|]/g, " ").replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderLyricHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const safe = escapeHtml(line) || "&nbsp;";
      if (!likelyChordLine(line)) {
        return highlightChords(safe, false);
      }
      return highlightChords(safe, true);
    })
    .join("<br>");
}

function highlightChords(escapedLine: string, force: boolean): string {
  const re = new RegExp(CHORD_REGEX.source, "g");
  return escapedLine.replace(re, (chord) => {
    if (!force && chord.length === 1) return chord;
    return `<button type="button" class="chord" data-chord="${chord}">${chord}</button>`;
  });
}

function chordHits(text: string): string {
  const chords = extractChords(text);
  if (!chords.length) return "No chords detected";
  return chords
    .map((c) => `<button type="button" class="chord-hit" data-chord="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
    .join(" · ");
}

function bindChordHits(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("[data-chord]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openChordPop(el.dataset.chord ?? "");
    });
  });
}

function closeChordPop(): void {
  chordPop?.remove();
  chordPop = null;
}

function openChordPop(symbol: string): void {
  const chord = symbol.trim();
  if (!chord) return;
  closeChordPop();
  const voicing = voicingForSymbol(chord);
  chordPop = document.createElement("div");
  chordPop.className = "chord-pop";
  chordPop.innerHTML = `
    <div class="chord-pop-card">
      <div class="voicing-head">${escapeHtml(chord)}</div>
      ${diagramForSymbol(chord)}
      ${
        voicing
          ? `<pre class="chord-tab">${shapeToTab(voicing.shape)}</pre>`
          : `<p class="muted" style="grid-column:1/-1;margin:0">No guitar shape for this chord yet.</p>`
      }
    </div>
  `;
  chordPop.addEventListener("click", (e) => {
    if (e.target === chordPop) closeChordPop();
  });
  document.body.append(chordPop);
  playChord(chord.replace(/\/[A-G][#b]?$/, ""));
}

async function prepareImage(file: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!;
    const v = g < 140 ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
