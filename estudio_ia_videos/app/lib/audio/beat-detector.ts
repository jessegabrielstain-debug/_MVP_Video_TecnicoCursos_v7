export interface BeatDetectionResult {
  bpm: number;
  beats: number[]; // seconds
  confidence: number; // 0..1
}

// Simple spectral flux stub using provided waveform samples
export function estimateBeatsFromWaveform(waveform: number[], sampleRate: number): BeatDetectionResult {
  const N = waveform.length;
  if (N === 0 || sampleRate <= 0) return { bpm: 100, beats: [], confidence: 0 };
  const energy: number[] = new Array(N);
  for (let i = 0; i < N; i++) {
    energy[i] = Math.abs(waveform[i]);
  }
  const window = Math.floor(sampleRate * 0.02); // 20ms
  const flux: number[] = [];
  for (let i = window; i < N; i++) {
    flux.push(Math.max(0, energy[i] - energy[i - window]));
  }
  const threshold = percentile(flux, 90);
  const peaks: number[] = [];
  const minDist = Math.floor(sampleRate * 0.2); // 200ms
  let last = -minDist;
  for (let i = window; i < N; i++) {
    const f = Math.max(0, energy[i] - energy[i - window]);
    if (f >= threshold && i - last >= minDist) {
      peaks.push(i);
      last = i;
    }
  }
  if (peaks.length < 2) return { bpm: 100, beats: [], confidence: 0.2 };
  const intervals = [];
  for (let i = 1; i < peaks.length; i++) intervals.push(peaks[i] - peaks[i - 1]);
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = 60 * sampleRate / avgInterval;
  const beats = peaks.map(p => p / sampleRate);
  const variance = intervals.reduce((acc, d) => acc + Math.pow(d - avgInterval, 2), 0) / intervals.length;
  const confidence = Math.max(0, Math.min(1, 1 / (1 + variance / (sampleRate * 0.5))));
  return { bpm, beats, confidence };
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}
