import { estimateBeatsFromWaveform } from '../../../app/lib/audio/beat-detector';

describe('Beat Detector', () => {
  test('detects approximate BPM and beats on synthetic waveform', () => {
    const sampleRate = 1000; // 1kHz for simplicity
    const durationSec = 10;
    const N = sampleRate * durationSec;
    const waveform = new Array(N).fill(0);
    const bpm = 120; // 2 beats per second
    const interval = Math.floor(sampleRate * (60 / bpm));
    for (let i = 0; i < N; i += interval) {
      // spike
      waveform[i] = 1;
    }
    const result = estimateBeatsFromWaveform(waveform, sampleRate);
    expect(result.bpm).toBeGreaterThan(100);
    expect(result.bpm).toBeLessThan(140);
    expect(result.beats.length).toBeGreaterThan(5);
    expect(result.confidence).toBeGreaterThan(0.2);
  });
});
