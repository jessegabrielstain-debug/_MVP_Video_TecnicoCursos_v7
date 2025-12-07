# 🚀 AUDIO MIXER - GUIA DE INÍCIO RÁPIDO

## ⚡ Começando em 5 Minutos

### 1. Import e Setup Básico

```typescript
import { AudioMixer, createBasicMixer } from '@/lib/audio/audio-mixer';

// Opção 1: Criar mixer do zero
const mixer = new AudioMixer({
  sampleRate: 44100,
  channels: 2,
  normalize: true,
  targetLUFS: -16
});

// Opção 2: Usar preset (RECOMENDADO)
const mixer = createBasicMixer();
```

---

### 2. Adicionar Tracks

```typescript
// Track simples
await mixer.addTrack({
  name: 'Voice',
  filePath: './audio/narration.mp3',
  volume: 1.0
});

// Track com processamento
await mixer.addTrack({
  name: 'Music',
  filePath: './audio/background.mp3',
  volume: 0.6,
  pan: 0,
  fadeIn: 1,
  fadeOut: 2
});
```

---

### 3. Exportar

```typescript
const result = await mixer.export({
  outputPath: './output/final.mp3',
  format: 'mp3',
  bitrate: '192k',
  normalize: true
});

console.log(`✅ Mix criado: ${result.outputPath}`);
console.log(`   Duração: ${result.duration}s`);
console.log(`   LUFS: ${result.lufs} dB`);
```

---

## 📋 RECEITAS RÁPIDAS

### Podcast com 2 Hosts

```typescript
import { createPodcastMixer } from '@/lib/audio/audio-mixer';

const mixer = createPodcastMixer();

// Host 1 (esquerda)
await mixer.addTrack({
  name: 'Host 1',
  filePath: './host1.mp3',
  pan: -0.3,
  compressor: { threshold: -20, ratio: 4 }
});

// Host 2 (direita)
await mixer.addTrack({
  name: 'Host 2',
  filePath: './host2.mp3',
  pan: 0.3,
  compressor: { threshold: -20, ratio: 4 }
});

// Exportar
await mixer.export({
  outputPath: './podcast.mp3',
  bitrate: '192k'
});
```

---

### Curso com Narração + Música de Fundo

```typescript
import { createCourseMixer } from '@/lib/audio/audio-mixer';

// Setup automático com ducking!
const mixer = await createCourseMixer(
  './narration.mp3',  // Voz do instrutor
  './music.mp3'       // Música de fundo
);

// Música abaixa automaticamente quando voz toca

await mixer.export({
  outputPath: './course-lecture.mp3',
  normalize: true
});
```

---

### Mix Musical Simples

```typescript
const mixer = createBasicMixer();

// Bateria
await mixer.addTrack({
  name: 'Drums',
  filePath: './drums.wav',
  volume: 1.0,
  eq: {
    lowGain: 3,    // Boost graves
    highGain: 2    // Boost pratos
  }
});

// Baixo
await mixer.addTrack({
  name: 'Bass',
  filePath: './bass.wav',
  volume: 0.9,
  eq: { lowGain: 4 }
});

// Vocal com reverb
const vocalId = await mixer.addTrack({
  name: 'Vocals',
  filePath: './vocals.wav',
  volume: 1.0,
  eq: {
    lowGain: -5,   // Cortar graves
    midGain: 3,    // Boost presença
  }
});

mixer.addEffect(vocalId, {
  type: 'reverb',
  mix: 0.25,
  parameters: { roomSize: 0.6 }
});

await mixer.export({
  outputPath: './mix.wav',
  format: 'wav'
});
```

---

## 🎚️ CONTROLES ESSENCIAIS

### Volume e Pan

```typescript
const trackId = await mixer.addTrack({ /* ... */ });

mixer.setVolume(trackId, 0.8);  // 80%
mixer.setPan(trackId, -0.5);    // 50% esquerda
mixer.setMute(trackId, true);   // Silenciar
mixer.setSolo(trackId, true);   // Solo (silencia outras)
```

---

### Equalização (EQ)

```typescript
mixer.setEQ(trackId, {
  lowGain: 3,      // +3 dB em graves (100 Hz)
  midGain: -2,     // -2 dB em médios (1 kHz)
  highGain: 4,     // +4 dB em agudos (10 kHz)
  
  // Customizar frequências
  lowFreq: 80,     // Graves em 80 Hz
  midFreq: 2000,   // Médios em 2 kHz
  highFreq: 12000  // Agudos em 12 kHz
});
```

**Presets Comuns:**

| Tipo | Low | Mid | High | Uso |
|------|-----|-----|------|-----|
| **Voice** | -5 | +3 | +2 | Clareza vocal |
| **Music Warm** | +3 | 0 | +1 | Música suave |
| **Podcast** | -3 | +2 | +3 | Voz profissional |
| **Bass Boost** | +6 | -1 | +1 | Ênfase graves |

---

### Compressor

```typescript
mixer.setCompressor(trackId, {
  threshold: -20,    // Ativa em -20 dB
  ratio: 4,          // Compressão 4:1
  attack: 5,         // 5 ms de ataque
  release: 50,       // 50 ms de release
  makeupGain: 3      // +3 dB de compensação
});
```

**Presets:**

```typescript
// Voz suave
{ threshold: -20, ratio: 3, attack: 5, release: 50 }

// Voz agressiva
{ threshold: -16, ratio: 6, attack: 3, release: 40 }

// Música sutil
{ threshold: -12, ratio: 2, attack: 10, release: 100 }
```

---

### Efeitos

```typescript
// Reverb
mixer.addEffect(trackId, {
  type: 'reverb',
  mix: 0.3,  // 30% wet
  parameters: {
    roomSize: 0.7,
    damping: 0.5,
    predelay: 20
  }
});

// Delay
mixer.addEffect(trackId, {
  type: 'delay',
  mix: 0.4,
  parameters: {
    time: 250,      // 250 ms
    feedback: 0.5   // 50%
  }
});

// Chorus
mixer.addEffect(trackId, {
  type: 'chorus',
  mix: 0.5,
  parameters: {
    rate: 0.5,
    depth: 0.7
  }
});
```

---

### Ducking (Auto-Abaixar Música)

```typescript
// Música abaixa quando narração toca
mixer.addDucking({
  targetTrackId: 'music-id',      // Track que abaixa
  triggerTrackId: 'narration-id', // Track que dispara
  threshold: -25,                  // Ativa quando voz > -25 dB
  reduction: 0.7,                  // Reduz 70% do volume
  attack: 5,                       // Abaixa em 5 ms
  release: 200                     // Volta em 200 ms
});
```

---

### Automação

```typescript
// Fade out de volume
mixer.addAutomation(trackId, {
  parameter: 'volume',
  timestamp: 0,
  value: 1.0
});

mixer.addAutomation(trackId, {
  parameter: 'volume',
  timestamp: 10,
  value: 0.0,  // Fade de 10 segundos
  interpolation: 'linear'
});

// Pan sweep (movimento estéreo)
mixer.addAutomation(trackId, {
  parameter: 'pan',
  timestamp: 0,
  value: -1  // Esquerda
});

mixer.addAutomation(trackId, {
  parameter: 'pan',
  timestamp: 5,
  value: 1   // Move para direita em 5s
});
```

---

## 🎯 FORMATOS DE EXPORT

### MP3 (Distribuição)

```typescript
await mixer.export({
  outputPath: './output.mp3',
  format: 'mp3',
  bitrate: '192k',    // ou '128k', '256k', '320k'
  sampleRate: 44100,
  normalize: true,
  targetLUFS: -16
});
```

**Bitrates Recomendados:**
- `128k` - Podcasts, voz (tamanho pequeno)
- `192k` - Padrão (ótimo custo-benefício)
- `320k` - Máxima qualidade MP3

---

### WAV (Sem Perdas)

```typescript
await mixer.export({
  outputPath: './master.wav',
  format: 'wav',
  sampleRate: 48000,
  channels: 2
});
```

**Uso**: Edição posterior, arquivamento

---

### AAC (Mobile/Streaming)

```typescript
await mixer.export({
  outputPath: './mobile.aac',
  format: 'aac',
  bitrate: '128k',
  sampleRate: 44100
});
```

**Uso**: Apps mobile, streaming eficiente

---

### FLAC (Sem Perdas Comprimido)

```typescript
await mixer.export({
  outputPath: './archive.flac',
  format: 'flac',
  sampleRate: 48000
});
```

**Uso**: Arquivamento com compressão

---

## 📊 NORMALIZAÇÃO LUFS

### Targets por Plataforma

```typescript
// Podcasts (Apple, Spotify)
{ normalize: true, targetLUFS: -16 }

// YouTube, Streaming de Música
{ normalize: true, targetLUFS: -14 }

// TV Broadcast
{ normalize: true, targetLUFS: -23 }

// Cursos Online
{ normalize: true, targetLUFS: -16 }
```

---

## 🎛️ FACTORY PRESETS

### 1. Basic Mixer

```typescript
import { createBasicMixer } from '@/lib/audio/audio-mixer';

const mixer = createBasicMixer();
// Configuração: 44.1kHz, stereo, sem normalização
```

---

### 2. Podcast Mixer

```typescript
import { createPodcastMixer } from '@/lib/audio/audio-mixer';

const mixer = createPodcastMixer();
// Configuração: 48kHz, stereo, normalização -16 LUFS
```

---

### 3. Course Mixer (Com Ducking!)

```typescript
import { createCourseMixer } from '@/lib/audio/audio-mixer';

const mixer = await createCourseMixer(
  './narration.mp3',  // Voz
  './music.mp3'       // Música
);

// Setup automático:
// - Narração: EQ para clareza, compressor suave
// - Música: Ducking ativo (abaixa quando voz toca)
// - Normalização: -16 LUFS
```

---

### 4. Ducking Mixer

```typescript
import { createDuckingMixer } from '@/lib/audio/audio-mixer';

const mixer = await createDuckingMixer(
  './voice.mp3',      // Track principal
  './background.mp3', // Track de fundo
  0.6                 // Redução de 60%
);
```

---

## 🔔 EVENTOS EM TEMPO REAL

```typescript
mixer.on('track:added', (track) => {
  console.log(`Track adicionada: ${track.name}`);
});

mixer.on('track:volume', ({ trackId, volume }) => {
  console.log(`Volume: ${volume * 100}%`);
});

mixer.on('export:start', () => {
  console.log('Exportando...');
});

mixer.on('export:complete', (result) => {
  console.log(`✅ Completo: ${result.outputPath}`);
  console.log(`   LUFS: ${result.lufs} dB`);
});

mixer.on('error', (error) => {
  console.error('❌ Erro:', error.message);
});
```

---

## ⚡ DICAS DE PERFORMANCE

### 1. Limitar Número de Tracks

```typescript
// ❌ Evitar: 50+ tracks
// ✅ Recomendado: 10-20 tracks
```

**Impacto**: Cada track adiciona ~3-5s ao tempo de export.

---

### 2. Usar Formatos Eficientes

```typescript
// Para testes rápidos
{ format: 'mp3', bitrate: '128k' }  // Rápido

// Para produção
{ format: 'mp3', bitrate: '320k' }  // Qualidade
```

---

### 3. Desativar Normalização em Testes

```typescript
// Durante desenvolvimento
{ normalize: false }  // Economiza ~5-10s

// Para versão final
{ normalize: true, targetLUFS: -16 }
```

---

### 4. Processar Antes de Adicionar

```typescript
// Se possível, pré-processe arquivos grandes
// Use menor sample rate para testes (22050 Hz)
```

---

## 🚨 SOLUÇÃO DE PROBLEMAS

### Erro: "File not found"

```typescript
// ❌ Caminho relativo problemático
filePath: './audio.mp3'

// ✅ Use caminho absoluto
filePath: path.join(__dirname, 'audio', 'file.mp3')
```

---

### Erro: "FFmpeg not found"

```bash
# Instalar FFmpeg
# Windows (com chocolatey)
choco install ffmpeg

# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

---

### Clipping/Distorção no Export

```typescript
// ❌ Problema: Volumes muito altos
{ volume: 2.0 }  // 200%!

// ✅ Solução: Deixar headroom
{ volume: 0.7 }  // 70%
mixer.setMasterVolume(0.8);
```

**Regra**: Nunca ultrapasse 0.8-0.9 no volume total.

---

### Export Muito Lento

```typescript
// Causas comuns:
// 1. Muitas tracks (>20)
// 2. Formato lossless (WAV/FLAC)
// 3. Normalização ativa
// 4. Sample rate muito alto (96kHz+)

// Solução: Otimizar configurações
{
  format: 'mp3',
  bitrate: '192k',
  sampleRate: 44100,
  normalize: false  // Para testes
}
```

---

## 📚 EXEMPLOS COMPLETOS

### Exemplo 1: Podcast Profissional

```typescript
import { createPodcastMixer } from '@/lib/audio/audio-mixer';

async function createPodcast() {
  const mixer = createPodcastMixer();
  
  // Intro
  await mixer.addTrack({
    name: 'Intro',
    filePath: './intro.mp3',
    volume: 1.0,
    fadeOut: 2
  });
  
  // Host 1
  const host1 = await mixer.addTrack({
    name: 'Host 1',
    filePath: './host1.mp3',
    volume: 1.0,
    pan: -0.3,
    eq: { lowGain: -3, midGain: 2, highGain: 1 },
    compressor: { threshold: -20, ratio: 4, attack: 5, release: 50 }
  });
  
  // Host 2
  await mixer.addTrack({
    name: 'Host 2',
    filePath: './host2.mp3',
    volume: 1.0,
    pan: 0.3,
    eq: { lowGain: -3, midGain: 2, highGain: 1 },
    compressor: { threshold: -20, ratio: 4, attack: 5, release: 50 }
  });
  
  // Música de fundo
  await mixer.addTrack({
    name: 'Background',
    filePath: './music.mp3',
    volume: 0.3,
    fadeIn: 2,
    fadeOut: 3
  });
  
  // Exportar
  const result = await mixer.export({
    outputPath: './podcast-episode-01.mp3',
    format: 'mp3',
    bitrate: '192k',
    normalize: true,
    targetLUFS: -16
  });
  
  console.log(`✅ Podcast criado!`);
  console.log(`   Arquivo: ${result.outputPath}`);
  console.log(`   Duração: ${result.duration}s`);
  console.log(`   Tamanho: ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   LUFS: ${result.lufs} dB`);
}

createPodcast();
```

---

### Exemplo 2: Aula Online Automática

```typescript
import { createCourseMixer } from '@/lib/audio/audio-mixer';

async function createLesson() {
  // Setup com ducking automático
  const mixer = await createCourseMixer(
    './lecture-narration.mp3',
    './background-music.mp3'
  );
  
  // Adicionar vinheta de abertura
  await mixer.addTrack({
    name: 'Opening',
    filePath: './course-intro.mp3',
    volume: 1.0,
    startTime: 0,
    fadeIn: 1,
    fadeOut: 2
  });
  
  // Exportar aula
  const result = await mixer.export({
    outputPath: './lesson-01.mp3',
    format: 'aac',
    bitrate: '128k',
    normalize: true,
    targetLUFS: -16
  });
  
  console.log(`✅ Aula criada: ${result.outputPath}`);
}

createLesson();
```

---

### Exemplo 3: Mix Musical com Efeitos

```typescript
import { createBasicMixer } from '@/lib/audio/audio-mixer';

async function createMusicMix() {
  const mixer = createBasicMixer();
  
  // Bateria
  await mixer.addTrack({
    name: 'Drums',
    filePath: './drums.wav',
    volume: 1.0,
    eq: { lowGain: 3, midGain: -2, highGain: 2 },
    compressor: { threshold: -12, ratio: 4 }
  });
  
  // Baixo
  await mixer.addTrack({
    name: 'Bass',
    filePath: './bass.wav',
    volume: 0.9,
    eq: { lowGain: 4, midGain: -1 }
  });
  
  // Guitarra com chorus
  const guitar = await mixer.addTrack({
    name: 'Guitar',
    filePath: './guitar.wav',
    volume: 0.8,
    pan: -0.5
  });
  
  mixer.addEffect(guitar, {
    type: 'chorus',
    mix: 0.4,
    parameters: { rate: 0.5, depth: 0.6 }
  });
  
  // Vocal com reverb e delay
  const vocal = await mixer.addTrack({
    name: 'Vocals',
    filePath: './vocals.wav',
    volume: 1.0,
    eq: { lowGain: -5, midGain: 3, highGain: 2 },
    compressor: { threshold: -18, ratio: 4, makeupGain: 6 }
  });
  
  mixer.addEffect(vocal, {
    type: 'reverb',
    mix: 0.25,
    parameters: { roomSize: 0.6, damping: 0.5 }
  });
  
  mixer.addEffect(vocal, {
    type: 'delay',
    mix: 0.2,
    parameters: { time: 250, feedback: 0.3 }
  });
  
  // Exportar WAV master + MP3
  await mixer.export({
    outputPath: './master.wav',
    format: 'wav',
    normalize: true,
    targetLUFS: -14
  });
  
  await mixer.export({
    outputPath: './master.mp3',
    format: 'mp3',
    bitrate: '320k',
    normalize: true,
    targetLUFS: -14
  });
  
  console.log('✅ Mix completo!');
}

createMusicMix();
```

---

## 🎓 RECURSOS ADICIONAIS

### Documentação Completa
- `AUDIO_MIXER_REPORT_10_OUT_2025.md` - Relatório executivo completo

### Arquivos do Projeto
- Código: `app/lib/audio/audio-mixer.ts`
- Testes: `app/__tests__/lib/audio/audio-mixer.test.ts`

### Referências Externas
- FFmpeg Audio Filters: https://ffmpeg.org/ffmpeg-filters.html
- EBU R128 Loudness: https://tech.ebu.ch/docs/r/r128.pdf

---

## ✅ CHECKLIST DE INÍCIO

- [ ] FFmpeg instalado (`ffmpeg -version`)
- [ ] Import do módulo (`import { AudioMixer } from '@/lib/audio/audio-mixer'`)
- [ ] Arquivos de áudio preparados
- [ ] Escolher preset apropriado (Basic, Podcast, Course)
- [ ] Adicionar tracks com configurações
- [ ] Testar com export rápido (MP3 128k, sem normalização)
- [ ] Ajustar EQ, compressor, efeitos conforme necessário
- [ ] Export final com normalização ativa
- [ ] Verificar LUFS no resultado (`result.lufs`)

---

**🎛️ Audio Mixer - Mixing Profissional Simplificado**

*Para exemplos completos e casos de uso avançados, consulte AUDIO_MIXER_REPORT_10_OUT_2025.md*
