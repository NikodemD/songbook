const NOTE_FREQ: Record<string, number> = {
  C: 261.63,
  "C#": 277.18,
  Db: 277.18,
  D: 293.66,
  "D#": 311.13,
  Eb: 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  Gb: 369.99,
  G: 392.0,
  "G#": 415.3,
  Ab: 415.3,
  A: 440.0,
  "A#": 466.16,
  Bb: 466.16,
  B: 493.88,
};

const QUALITY_INTERVALS: Record<string, number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  "7": [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dim: [0, 3, 6],
  m7b5: [0, 3, 6, 10],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  "7sus4": [0, 5, 7, 10],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  "9": [0, 4, 7, 10, 14],
  add9: [0, 4, 7, 14],
};

let ctx: AudioContext | null = null;

export function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function parseChord(symbol: string): { root: string; quality: string } {
  const m = symbol.match(/^([A-G][#b]?)(.*)$/);
  return { root: m?.[1] ?? "C", quality: m?.[2] ?? "" };
}

export function playChord(symbol: string, duration = 1.1): void {
  const ac = audio();
  const { root, quality } = parseChord(symbol);
  const base = NOTE_FREQ[root] ?? 261.63;
  const ivs = QUALITY_INTERVALS[quality] ?? QUALITY_INTERVALS[""]!;
  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  master.connect(ac.destination);

  ivs.forEach((semitone, i) => {
    const freq = base * Math.pow(2, semitone / 12);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = i === 0 ? "triangle" : "sine";
    osc.frequency.value = freq / 2;
    gain.gain.value = i === 0 ? 0.55 : 0.28;
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  });
}

export async function playProgression(chords: string[], bpm = 90): Promise<void> {
  const beat = 60_000 / bpm;
  for (const chord of chords) {
    playChord(chord, (beat * 1.6) / 1000);
    await new Promise((r) => setTimeout(r, beat));
  }
}
