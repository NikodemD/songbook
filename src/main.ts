import "./styles.css";
import { isStandalone } from "./dom";
import { renderScales } from "./screens/scales";
import { renderProgressions } from "./screens/progressions";
import { renderSongs } from "./screens/songs";
import { renderTabs } from "./screens/tabs";
import { renderTuner, stopTuner } from "./screens/tuner";

type Tab = "scales" | "progressions" | "songs" | "tabs" | "tuner";

const TABS: { id: Tab; label: string; icon: string }[] = [
  {
    id: "scales",
    label: "Scales",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8h16M4 12h16M4 16h16"/><circle cx="8" cy="12" r="1.6" fill="currentColor"/><circle cx="15" cy="8" r="1.6" fill="currentColor"/></svg>`,
  },
  {
    id: "progressions",
    label: "Chords",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="5" height="14" rx="1"/><rect x="10.5" y="5" width="5" height="14" rx="1"/><rect x="17" y="5" width="3" height="14" rx="1"/></svg>`,
  },
  {
    id: "songs",
    label: "Songs",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 5h10l4 4v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M15 5v4h4"/><path d="M8 13h8M8 17h5"/></svg>`,
  },
  {
    id: "tabs",
    label: "Tabs",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 10.5h16M4 14h16M4 17.5h16"/><path d="M9 7v10.5M15 7v10.5"/></svg>`,
  },
  {
    id: "tuner",
    label: "Tuner",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21a8 8 0 1 0-8-8"/><path d="M12 13l5-7"/></svg>`,
  },
];

function currentTab(): Tab {
  const hash = location.hash.replace("#/", "") as Tab;
  return TABS.some((t) => t.id === hash) ? hash : "scales";
}

function mount(): void {
  const app = document.querySelector("#app");
  if (!app) return;
  const tab = currentTab();
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <span>Pocket gig bag</span>
          <h1>Songbook</h1>
        </div>
        ${
          isStandalone()
            ? ""
            : `<p class="install">On iPhone: Share → Add to Home Screen</p>`
        }
      </header>
      <main class="screen" id="screen"></main>
      <nav class="tabbar">
        ${TABS.map(
          (t) =>
            `<button class="tab ${t.id === tab ? "active" : ""}" data-tab="${t.id}">${t.icon}<span>${t.label}</span></button>`,
        ).join("")}
      </nav>
    </div>
  `;

  app.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      location.hash = `#/${btn.dataset.tab}`;
    });
  });

  stopTuner();
  const screen = app.querySelector<HTMLElement>("#screen")!;
  if (tab === "scales") renderScales(screen);
  if (tab === "progressions") renderProgressions(screen);
  if (tab === "songs") renderSongs(screen);
  if (tab === "tabs") renderTabs(screen);
  if (tab === "tuner") renderTuner(screen);
}

window.addEventListener("hashchange", mount);
mount();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js");
  });
}
