/** Autocorrelation pitch detector with parabolic interpolation. */
export function detectPitch(buf: Float32Array, sampleRate: number): number | null {
  const size = buf.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i]! * buf[i]!;
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return null;

  const maxLag = Math.floor(sampleRate / 70);
  const minLag = Math.floor(sampleRate / 1100);
  const corr = new Float32Array(maxLag);

  for (let lag = minLag; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < size - lag; i++) {
      sum += buf[i]! * buf[i + lag]!;
    }
    corr[lag] = sum;
  }

  let bestLag = minLag;
  let best = -1;
  for (let lag = minLag + 1; lag < maxLag - 1; lag++) {
    const c = corr[lag]!;
    if (c > corr[lag - 1]! && c >= corr[lag + 1]! && c > best) {
      best = c;
      bestLag = lag;
    }
  }

  if (best <= 0) return null;

  const y0 = corr[bestLag - 1] ?? best;
  const y1 = corr[bestLag]!;
  const y2 = corr[bestLag + 1] ?? best;
  const denom = 2 * (2 * y1 - y2 - y0);
  const shift = denom === 0 ? 0 : (y2 - y0) / denom;
  const freq = sampleRate / (bestLag + shift);
  if (freq < 70 || freq > 1100) return null;
  return freq;
}

export function centsOff(freq: number, target: number): number {
  return Math.round(1200 * Math.log2(freq / target));
}

export function nearestNote(freq: number): { midi: number; name: string; target: number; cents: number } {
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const name = names[((midi % 12) + 12) % 12]!;
  const target = 440 * Math.pow(2, (midi - 69) / 12);
  return { midi, name, target, cents: centsOff(freq, target) };
}
