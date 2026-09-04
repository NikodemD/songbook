import { h, escapeHtml } from "../dom";
import { extractChords, likelyChordLine, CHORD_REGEX } from "../theory";
import { deleteSong, getSong, listSongs, newId, saveSong, type Song } from "../storage";

type View = { mode: "list" } | { mode: "edit"; draft: Draft } | { mode: "read"; id: string };

interface Draft {
  id?: string;
  title: string;
  text: string;
  image?: Blob;
  status: string;
  progress: number;
}

let view: View = { mode: "list" };

export function renderSongs(root: HTMLElement): void {
  void paint(root);
}

async function paint(root: HTMLElement): Promise<void> {
  if (view.mode === "list") {
    const songs = await listSongs();
    root.innerHTML = h`
      <div>
        <p class="muted">Photograph a chord sheet or screenshot. The app reads the lyrics, highlights chords, and stores the song on this phone.</p>
        <div class="btn-row">
          <button class="btn" data-act="photo">Scan photo</button>
          <button class="btn ghost" data-act="paste">Paste text</button>
        </div>
        <input class="hidden-file" type="file" accept="image/*" data-file />
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
    root.querySelectorAll<HTMLButtonElement>("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        view = { mode: "read", id: btn.dataset.open! };
        void paint(root);
      });
    });
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
          <p class="muted">${extractChords(song.text).join(" · ") || "No chords detected"}</p>
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
        draft: { id: song.id, title: song.title, text: song.text, image: song.image, status: "", progress: 0 },
      };
      void paint(root);
    });
    root.querySelector("[data-act=delete]")?.addEventListener("click", async () => {
      await deleteSong(song.id);
      view = { mode: "list" };
      void paint(root);
    });
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
      createdAt: Date.now(),
      image: draft.image,
    };
    await saveSong(song);
    view = { mode: "read", id: song.id };
    void paint(root);
  });
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
    return `<span class="chord">${chord}</span>`;
  });
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
