import { h, escapeHtml } from "../dom";
import { extractChords } from "../theory";
import { deleteTab, getTab, listTabs, newId, saveTab, type GuitarTab } from "../storage";
import { importTabFromUrl } from "../importUrl";
import { isTabLine, renderTabHtml } from "../tabparse";

type View = { mode: "list" } | { mode: "edit"; draft: Draft } | { mode: "read"; id: string };

interface Draft {
  id?: string;
  title: string;
  tab: string;
  sourceUrl: string;
  status: string;
}

let view: View = { mode: "list" };

export function renderTabs(root: HTMLElement): void {
  void paint(root);
}

async function paint(root: HTMLElement): Promise<void> {
  if (view.mode === "list") {
    const tabs = await listTabs();
    root.innerHTML = h`
      <div>
        <p class="muted">Paste a public tab page link. The app reads the page, pulls out the tab or chords, and saves it on this phone.</p>
        <input class="field" data-url placeholder="https://…" inputmode="url" autocapitalize="off" autocomplete="off" />
        <div class="btn-row">
          <button class="btn" data-act="import">Import link</button>
          <button class="btn ghost" data-act="paste">Paste tab</button>
        </div>
        <p class="muted" data-status></p>
        ${
          tabs.length === 0
            ? `<div class="empty">No imported tabs yet.</div>`
            : `<div class="prog-list" style="margin-top:14px">${tabs
                .map(
                  (t) =>
                    `<button class="song-item" data-open="${t.id}"><span><strong>${escapeHtml(t.title)}</strong><div class="muted">${t.sourceUrl ? hostOf(t.sourceUrl) : "Pasted"} · ${new Date(t.createdAt).toLocaleDateString()}</div></span><span class="muted">Open</span></button>`,
                )
                .join("")}</div>`
        }
      </div>
    `;
    root.querySelector("[data-act=import]")?.addEventListener("click", () => void importLink(root));
    root.querySelector("[data-url]")?.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") void importLink(root);
    });
    root.querySelector("[data-act=paste]")?.addEventListener("click", () => {
      view = { mode: "edit", draft: { title: "Untitled tab", tab: "", sourceUrl: "", status: "" } };
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
    const tab = await getTab(view.id);
    if (!tab) {
      view = { mode: "list" };
      void paint(root);
      return;
    }
    root.innerHTML = h`
      <div>
        <button class="btn ghost" data-act="back">All tabs</button>
        <div class="panel">
          <h2>${escapeHtml(tab.title)}</h2>
          <p class="muted">${tab.sourceUrl ? `<a class="source" href="${escapeHtml(tab.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(hostOf(tab.sourceUrl))}</a>` : "Pasted text"}${chordSummary(tab.tab)}</p>
        </div>
        <div class="tab-paper">${renderTabHtml(tab.tab, escapeHtml)}</div>
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
        draft: { id: tab.id, title: tab.title, tab: tab.tab, sourceUrl: tab.sourceUrl ?? "", status: "" },
      };
      void paint(root);
    });
    root.querySelector("[data-act=delete]")?.addEventListener("click", async () => {
      await deleteTab(tab.id);
      view = { mode: "list" };
      void paint(root);
    });
    return;
  }

  const draft = view.draft;
  root.innerHTML = h`
    <div>
      <button class="btn ghost" data-act="back">Cancel</button>
      ${draft.status ? `<div class="panel"><p>${escapeHtml(draft.status)}</p></div>` : ""}
      <label class="muted" style="display:block;margin-top:12px">Title</label>
      <input class="field" data-title value="${escapeHtml(draft.title)}" />
      <label class="muted" style="display:block;margin-top:12px">Source link (optional)</label>
      <input class="field" data-source value="${escapeHtml(draft.sourceUrl)}" inputmode="url" autocapitalize="off" />
      <label class="muted" style="display:block;margin-top:12px">Tab</label>
      <textarea class="field tab-edit" data-tab>${escapeHtml(draft.tab)}</textarea>
      <div class="tab-paper">${draft.tab ? renderTabHtml(draft.tab, escapeHtml) : ""}</div>
      <div class="btn-row">
        <button class="btn wide" data-act="save">Save tab</button>
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
  root.querySelector("[data-source]")?.addEventListener("input", (e) => {
    draft.sourceUrl = (e.target as HTMLInputElement).value;
  });
  root.querySelector("[data-tab]")?.addEventListener("input", (e) => {
    draft.tab = (e.target as HTMLTextAreaElement).value;
    const preview = root.querySelector(".tab-paper");
    if (preview) preview.innerHTML = renderTabHtml(draft.tab, escapeHtml);
  });
  root.querySelector("[data-act=save]")?.addEventListener("click", async () => {
    const record: GuitarTab = {
      id: draft.id ?? newId(),
      title: draft.title.trim() || "Untitled tab",
      tab: draft.tab.trim(),
      sourceUrl: draft.sourceUrl.trim() || undefined,
      createdAt: Date.now(),
    };
    await saveTab(record);
    view = { mode: "read", id: record.id };
    void paint(root);
  });
}

async function importLink(root: HTMLElement): Promise<void> {
  const input = root.querySelector<HTMLInputElement>("[data-url]");
  const status = root.querySelector("[data-status]");
  const url = input?.value ?? "";
  if (status) status.textContent = "Reading that page…";
  try {
    const imported = await importTabFromUrl(url);
    view = {
      mode: "edit",
      draft: {
        title: imported.title,
        tab: imported.tab,
        sourceUrl: imported.sourceUrl,
        status: "",
      },
    };
    await paint(root);
  } catch (err) {
    if (status) status.textContent = err instanceof Error ? err.message : "Import failed.";
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function chordSummary(tab: string): string {
  const chords = extractChords(
    tab
      .split("\n")
      .filter((line) => !isTabLine(line))
      .join("\n"),
  ).slice(0, 8);
  return chords.length ? ` · ${chords.join(" · ")}` : "";
}
