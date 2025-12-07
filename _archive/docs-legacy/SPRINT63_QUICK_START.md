# Sprint 63 - Quick Start Guide
## Advanced Audio Processing System

**Start Time**: ⏱️ **5 minutos**  
**Module**: Advanced Audio Processing System  
**File**: `app/lib/audio/audio-processor.ts`

---

## 📦 Instalação

### Opção 1: Import Direto
```typescript
import { AdvancedAudioProcessor } from '@/lib/audio/audio-processor';

const audioProcessor = new AdvancedAudioProcessor();
```

### Opção 2: Factory - Basic (44.1kHz, 16-bit, 16 tracks)
```typescript
import { createBasicAudioProcessor } from '@/lib/audio/audio-processor';

const processor = createBasicAudioProcessor();
```

### Opção 3: Factory - Pro (96kHz, 32-bit, 128 tracks)
```typescript
import { createProAudioProcessor } from '@/lib/audio/audio-processor';

const processor = createProAudioProcessor();
```

### Opção 4: Factory - Dev (48kHz, 24-bit, 32 tracks)
```typescript
import { createDevAudioProcessor } from '@/lib/audio/audio-processor';

const processor = createDevAudioProcessor();
```

---

## 🎯 Exemplos Práticos

### 1. Track Management

#### Adicionar Track de Áudio
```typescript
// Audio data (stereo)
const audioData: Float32Array[] = [
  new Float32Array(48000), // Left channel (1 second at 48kHz)
  new Float32Array(48000), // Right channel
];

const trackId = processor.addTrack('Voice Over', audioData, 0);

console.log('Track created:', trackId);
// Output: Track created: track-1234567890-abc123
```

#### Ajustar Volume e Pan
```typescript
// Volume (0 = silent, 1 = full)
processor.setTrackVolume(trackId, 0.8);

// Pan (-1 = left, 0 = center, 1 = right)
processor.setTrackPan(trackId, 0.5); // 50% right
```

#### Mute e Solo
```typescript
// Mute track
processor.toggleMute(trackId, true);

// Solo track (mutes all other tracks)
processor.toggleSolo(trackId, true);
```

---

### 2. Equalizer

#### 5-Band Parametric EQ
```typescript
const eqId = processor.createEqualizer('Voice EQ', [
  { frequency: 80,   gain: -6, q: 0.7, type: 'lowshelf' },   // Cut low rumble
  { frequency: 250,  gain: 2,  q: 1.0, type: 'peaking' },    // Boost warmth
  { frequency: 1000, gain: 0,  q: 1.0, type: 'peaking' },    // Flat
  { frequency: 4000, gain: 3,  q: 1.0, type: 'peaking' },    // Boost presence
  { frequency: 12000, gain: 2, q: 0.7, type: 'highshelf' },  // Boost air
]);

// Add to track
processor.addEffectToTrack(trackId, eqId);
```

---

### 3. Compressor

#### Vocal Compression
```typescript
const compId = processor.createCompressor('Voice Comp', {
  threshold: -18,   // dB
  ratio: 4,         // 4:1
  attack: 3,        // ms
  release: 80,      // ms
  knee: 6,          // dB
  makeupGain: 6,    // dB
});

processor.addEffectToTrack(trackId, compId);
```

#### Music Bus Compression
```typescript
const masterComp = processor.createCompressor('Master Comp', {
  threshold: -12,
  ratio: 2,
  attack: 10,
  release: 150,
  knee: 3,
  makeupGain: 3,
});
```

---

### 4. Reverb

#### Small Room
```typescript
const reverbId = processor.createReverb('room', {
  mix: 0.2,        // 20% wet
  preDelay: 10,    // ms
});
```

#### Large Hall
```typescript
const hallId = processor.createReverb('hall', {
  mix: 0.3,
  preDelay: 30,
  decay: 4.5,
});
```

#### Cathedral (Long Decay)
```typescript
const cathedralId = processor.createReverb('cathedral', {
  mix: 0.4,
  decay: 8.0,
});
```

---

### 5. Delay

#### Stereo Delay
```typescript
const delayId = processor.createDelay('stereo', 500, {
  feedback: 0.4,
  mix: 0.3,
});
```

#### Ping-Pong Delay
```typescript
const pingPongId = processor.createDelay('pingpong', 300, {
  feedback: 0.5,
  mix: 0.4,
});
```

#### Tempo-Synced Delay
```typescript
const syncDelayId = processor.createDelay('mono', 500, {
  sync: true,
  tempo: 120,  // BPM
  feedback: 0.3,
});
```

---

### 6. Chorus

#### Subtle Chorus
```typescript
const chorusId = processor.createChorus({
  rate: 1.5,
  depth: 0.3,
  voices: 2,
  mix: 0.2,
});
```

#### Wide Chorus
```typescript
const wideChorus = processor.createChorus({
  rate: 2.0,
  depth: 0.6,
  voices: 4,
  spread: 0.8,
  mix: 0.4,
});
```

---

### 7. Flanger

#### Classic Flanger
```typescript
const flangerId = processor.createFlanger({
  rate: 0.5,
  depth: 0.5,
  feedback: 0.5,
  mix: 0.3,
});
```

---

### 8. Distortion

#### Soft Distortion
```typescript
const distId = processor.createDistortion('soft', {
  drive: 0.4,
  tone: 0.6,
  outputGain: 0,
  mix: 0.3,
});
```

#### Overdrive
```typescript
const overdriveId = processor.createDistortion('overdrive', {
  drive: 0.6,
  tone: 0.5,
  outputGain: -3,
});
```

---

### 9. Mixing

#### Mix Bus (Group Tracks)
```typescript
const voiceTrack1 = processor.addTrack('Voice 1');
const voiceTrack2 = processor.addTrack('Voice 2');

const vocalBusId = processor.createMixBus('Vocals', [
  voiceTrack1,
  voiceTrack2,
]);
```

#### Mix All Tracks to Stereo
```typescript
const duration = 60; // seconds

const mixedAudio = await processor.mixTracks(duration);

console.log('Mixed audio:', mixedAudio.length, 'channels');
// Output: Mixed audio: 2 channels (stereo)
```

---

### 10. Normalization & Dynamics

#### Normalize to -3dB
```typescript
const normalized = processor.normalize(audioData, -3);
```

#### Fade In (3 seconds)
```typescript
const fadedIn = processor.applyFadeIn(audioData, 3.0);
```

#### Fade Out (2 seconds)
```typescript
const fadedOut = processor.applyFadeOut(audioData, 2.0);
```

---

### 11. Noise Reduction

#### Remove Background Noise
```typescript
processor.applyNoiseReduction(trackId, {
  enabled: true,
  threshold: -40,   // dB
  reduction: 20,    // dB
  smoothing: 0.5,
});
```

---

### 12. Voice Enhancement

#### Professional Voice Processing
```typescript
processor.applyVoiceEnhancement(trackId, {
  enabled: true,
  deEsser: {
    enabled: true,
    frequency: 8000,  // Hz
    threshold: -15,   // dB
  },
  breathControl: {
    enabled: true,
    threshold: -40,   // dB
    reduction: 10,    // dB
  },
  warmth: 0.6,     // 0-1
  presence: 0.7,   // 0-1
  clarity: 0.5,    // 0-1
});
```

---

### 13. Ducking (Sidechain)

#### Music Ducking for Voice
```typescript
const voiceTrackId = processor.addTrack('Voice');
const musicTrackId = processor.addTrack('Music');

processor.applyDucking(musicTrackId, {
  enabled: true,
  sideChainTrackId: voiceTrackId,
  threshold: -20,  // dB
  ratio: 4,
  attack: 10,      // ms
  release: 100,    // ms
  range: 12,       // dB reduction
});
```

---

### 14. Audio Analysis

#### Analyze Track
```typescript
const analysis = processor.analyzeAudio(trackId);

console.log('Peak level:', analysis.peakLevel, 'dB');
console.log('RMS level:', analysis.rmsLevel, 'dB');
console.log('Dynamic range:', analysis.dynamicRange, 'dB');
console.log('Tempo:', analysis.tempo, 'BPM');
console.log('Key:', analysis.key);
console.log('Frequency balance:', analysis.frequency);
// Output:
// Peak level: -6.0 dB
// RMS level: -12.0 dB
// Dynamic range: 18.0 dB
// Tempo: 120 BPM
// Key: C
// Frequency balance: { low: 0.3, mid: 0.5, high: 0.2 }
```

---

### 15. Presets

#### Apply Preset
```typescript
const voicePresets = processor.getPresetsByCategory('voice');
const voiceOverPreset = voicePresets[0];

processor.applyPreset(trackId, voiceOverPreset.id);
```

#### Create Custom Preset
```typescript
const compId = processor.createCompressor('Comp');
const eqId = processor.createEqualizer('EQ');

const comp = processor['effects'].get(compId);
const eq = processor['effects'].get(eqId);

const presetId = processor.createPreset(
  'My Voice Chain',
  'Custom voice processing',
  'voice',
  [comp!, eq!]
);
```

---

## 🎬 Caso de Uso Completo: Podcast Editing

```typescript
import { AdvancedAudioProcessor } from '@/lib/audio/audio-processor';

async function processPodcast() {
  // 1. Create processor
  const processor = new AdvancedAudioProcessor({
    sampleRate: 48000,
    bitDepth: 24,
    maxTracks: 16,
  });

  // 2. Add tracks
  const host = processor.addTrack('Host', hostAudio, 0);
  const guest = processor.addTrack('Guest', guestAudio, 0);
  const music = processor.addTrack('Intro Music', musicAudio, 0);

  // 3. Voice processing for host
  const hostComp = processor.createCompressor('Host Comp', {
    threshold: -18,
    ratio: 4,
    attack: 3,
    release: 80,
  });
  const hostEQ = processor.createEqualizer('Host EQ', [
    { frequency: 80, gain: -6, q: 0.7, type: 'lowshelf' },
    { frequency: 250, gain: 2, q: 1.0, type: 'peaking' },
    { frequency: 4000, gain: 3, q: 1.0, type: 'peaking' },
  ]);

  processor.addEffectToTrack(host, hostEQ);
  processor.addEffectToTrack(host, hostComp);

  // 4. Voice enhancement
  processor.applyVoiceEnhancement(host, {
    enabled: true,
    deEsser: { enabled: true, frequency: 8000, threshold: -15 },
    breathControl: { enabled: true, threshold: -40, reduction: 10 },
    warmth: 0.6,
    presence: 0.7,
    clarity: 0.5,
  });

  // 5. Same for guest
  const guestComp = processor.createCompressor('Guest Comp', {
    threshold: -18,
    ratio: 4,
    attack: 3,
    release: 80,
  });
  processor.addEffectToTrack(guest, guestComp);

  // 6. Music ducking
  processor.applyDucking(music, {
    enabled: true,
    sideChainTrackId: host,
    threshold: -20,
    ratio: 4,
    attack: 10,
    release: 100,
    range: 12,
  });

  // 7. Noise reduction
  processor.applyNoiseReduction(host, {
    enabled: true,
    threshold: -40,
    reduction: 20,
    smoothing: 0.5,
  });

  // 8. Mix
  const finalMix = await processor.mixTracks(3600); // 1 hour

  // 9. Normalize
  const normalized = processor.normalize(finalMix, -1);

  // 10. Fade in intro music
  const faded = processor.applyFadeIn(normalized, 3.0);

  console.log('Podcast processed!');
  console.log('Stats:', processor.getStats());

  return faded;
}
```

---

## 📡 Event Listeners

### Track Events
```typescript
processor.on('track:added', (track) => {
  console.log('Track added:', track.name);
});

processor.on('track:updated', (track) => {
  console.log('Track updated:', track.name);
});

processor.on('track:deleted', (trackId) => {
  console.log('Track deleted:', trackId);
});

processor.on('track:mute-changed', ({ trackId, mute }) => {
  console.log('Mute changed:', trackId, mute);
});

processor.on('track:solo-changed', ({ trackId, solo }) => {
  console.log('Solo changed:', trackId, solo);
});
```

### Effect Events
```typescript
processor.on('effect:created', (effect) => {
  console.log('Effect created:', effect.type);
});

processor.on('track:effect-added', ({ trackId, effectId }) => {
  console.log('Effect added to track:', trackId);
});

processor.on('track:effect-removed', ({ trackId, effectId }) => {
  console.log('Effect removed from track:', trackId);
});

processor.on('effect:bypass-changed', ({ effectId, bypass }) => {
  console.log('Effect bypass:', effectId, bypass);
});
```

### Mixing Events
```typescript
processor.on('bus:created', (bus) => {
  console.log('Mix bus created:', bus.name);
});

processor.on('audio:mixed', ({ duration, samples }) => {
  console.log('Audio mixed:', duration, 'seconds');
});

processor.on('audio:normalized', ({ targetLevel, gain }) => {
  console.log('Normalized to', targetLevel, 'dB');
});
```

### Processing Events
```typescript
processor.on('noise-reduction:applied', ({ trackId, config }) => {
  console.log('Noise reduction applied:', trackId);
});

processor.on('voice-enhancement:applied', ({ trackId, config }) => {
  console.log('Voice enhancement applied:', trackId);
});

processor.on('ducking:applied', ({ targetTrackId, config }) => {
  console.log('Ducking applied:', targetTrackId);
});

processor.on('audio:analyzed', (analysis) => {
  console.log('Audio analyzed:', analysis);
});
```

### Preset Events
```typescript
processor.on('preset:created', (preset) => {
  console.log('Preset created:', preset.name);
});

processor.on('preset:applied', ({ trackId, presetId }) => {
  console.log('Preset applied:', presetId, 'to', trackId);
});
```

### System Events
```typescript
processor.on('config:updated', (config) => {
  console.log('Config updated:', config);
});

processor.on('activity:logged', (activity) => {
  console.log('Activity:', activity.description);
});

processor.on('system:reset', () => {
  console.log('System reset');
});

processor.on('error', (error) => {
  console.error('Error:', error.message);
});
```

---

## 🛠️ Configuração

### Obter Configuração
```typescript
const config = processor.getConfig();

console.log('Sample rate:', config.sampleRate);
console.log('Bit depth:', config.bitDepth);
console.log('Max tracks:', config.maxTracks);
```

### Atualizar Configuração
```typescript
processor.updateConfig({
  sampleRate: 96000,
  maxTracks: 128,
  enableRealTimeProcessing: true,
});
```

---

## 📊 Estatísticas

```typescript
const stats = processor.getStats();

console.log('Total tracks:', stats.totalTracks);
console.log('Active tracks:', stats.activeTracks);
console.log('Total effects:', stats.totalEffects);
console.log('Processing time:', stats.processingTime, 'ms');
console.log('CPU usage:', stats.cpuUsage, '%');
console.log('Peak level:', stats.peakLevel, 'dB');
```

---

## 🔄 Reset

```typescript
processor.reset();
// Clears all tracks, effects, buses
// Resets stats
// Recreates default presets
```

---

## 🧹 Cleanup

```typescript
processor.destroy();
// Removes all event listeners
```

---

## 🎯 Próximos Passos

1. ✅ Ler este guia (~5 min)
2. 🔧 Experimentar com exemplos práticos
3. 📚 Consultar `SPRINT63_FINAL_REPORT.md` para detalhes técnicos
4. 🎨 Integrar com UI components
5. 🚀 Deploy em produção

**Documentação Completa**: Veja `SPRINT63_FINAL_REPORT.md`  
**Referência Visual**: Veja `SPRINT63_RESUMO_VISUAL.md`  
**Testes**: Veja `app/__tests__/lib/audio/audio-processor.test.ts`
