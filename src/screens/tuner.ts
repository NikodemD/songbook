import { h } from "../dom";
import { TUNINGS, midiToFreq, noteName } from "../theory";
import { detectPitch, nearestNote } from "../pitch";

let running = false;
let raf = 0;
let stream: MediaStream | null = null;
let analyser: AnalyserNode | null = null;
let audioCtx: AudioContext | null = null;
let targetMidi: number | null = null;

export function renderTuner(root: HTMLElement): void {
  const tuning = TUNINGS[0]!;
  root.innerHTML = h`
    <div class="tuner">
      <p class="muted">Use your iPhone mic. Play a string, then hold the phone near the guitar.</p>
      <div class="note-big" data-note>--</div>
      <div class="cents" data-cents> </div>
      <div class="needle-wrap">
        <svg class="needle-arc" viewBox="0 0 200 90">
          <path d="M20 80 A80 80 0 0 1 180 80" fill="none" stroke="rgba(243,234,214,.2)" stroke-width="8" />
          <path d="M70 24 A80 80 0 0 1 130 24" fill="none" stroke="var(--ok)" stroke-width="8" />
        </svg>
        <div class="needle" data-needle></div>
      </div>
      <div class="strings" data-strings>
        ${tuning.midi
          .map((midi) => `<button class="string-btn" data-midi="${midi}">${noteName(midi, "sharp")}</button>`)
          .join("")}
      </div>
      <div class="btn-row" style="width:100%;max-width:360px">
        <button class="btn wide" data-act="mic">${running ? "Stop mic" : "Start tuner"}</button>
      </div>
      <p class="muted" data-msg></p>
    </div>
  `;

  root.querySelector("[data-act=mic]")?.addEventListener("click", () => {
    if (running) stop(root);
    else void start(root);
  });

  root.querySelectorAll<HTMLButtonElement>("[data-midi]").forEach((btn) => {
    btn.addEventListener("click", () => {
      targetMidi = Number(btn.dataset.midi);
      root.querySelectorAll(".string-btn").forEach((b) => b.classList.remove("hot"));
      btn.classList.add("hot");
    });
  });
}

export function stopTuner(): void {
  running = false;
  cancelAnimationFrame(raf);
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  void audioCtx?.close();
  audioCtx = null;
  analyser = null;
}

async function start(root: HTMLElement): Promise<void> {
  const msg = root.querySelector("[data-msg]");
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    audioCtx = new AudioContext();
    await audioCtx.resume();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    running = true;
    const btn = root.querySelector("[data-act=mic]");
    if (btn) btn.textContent = "Stop mic";
    if (msg) msg.textContent = "Listening…";
    loop(root);
  } catch {
    if (msg) msg.textContent = "Microphone permission is needed. Allow it for this site, then try again.";
  }
}

function stop(root: HTMLElement): void {
  stopTuner();
  const btn = root.querySelector("[data-act=mic]");
  if (btn) btn.textContent = "Start tuner";
  const note = root.querySelector("[data-note]");
  if (note) note.textContent = "--";
}

function loop(root: HTMLElement): void {
  if (!running || !analyser || !audioCtx) return;
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  const freq = detectPitch(buf, audioCtx.sampleRate);
  const noteEl = root.querySelector("[data-note]");
  const centsEl = root.querySelector("[data-cents]");
  const needle = root.querySelector<HTMLElement>("[data-needle]");

  if (freq) {
    const nearest = nearestNote(freq);
    const target = targetMidi ? midiToFreq(targetMidi) : nearest.target;
    const cents = Math.round(1200 * Math.log2(freq / target));
    const shown = targetMidi ? noteName(targetMidi, "sharp") : nearest.name;
    if (noteEl) {
      noteEl.textContent = shown;
      noteEl.className = "note-big" + (Math.abs(cents) < 5 ? " status-ok" : "");
    }
    if (centsEl) centsEl.textContent = `${cents > 0 ? "+" : ""}${cents} cents · ${freq.toFixed(1)} Hz`;
    if (needle) {
      const clamped = Math.max(-50, Math.min(50, cents));
      needle.style.transform = `translateX(-50%) rotate(${clamped * 1.4}deg)`;
      needle.style.background = Math.abs(cents) < 5 ? "var(--ok)" : "var(--gold)";
    }
  }

  raf = requestAnimationFrame(() => loop(root));
}
