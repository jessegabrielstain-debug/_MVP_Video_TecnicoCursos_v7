# 🎨 Video Effects Engine - Guia Rápido

## 🚀 Início Rápido (2 minutos)

### Instalação
```typescript
import VideoEffects from '@/lib/video/video-effects';
```

### Uso Básico
```typescript
const effects = new VideoEffects();

await effects.applyEffects('input.mp4', {
  colorFilter: { type: 'vintage', intensity: 0.8 }
}, {
  outputPath: 'output.mp4'
});
```

---

## 📋 Presets Prontos

### 1. Vintage/Retrô
```typescript
import { createVintageEffects } from '@/lib/video/video-effects';

const { effects, config } = createVintageEffects();
await effects.applyEffects('video.mp4', config);
```

### 2. Cinematográfico
```typescript
import { createCinematicEffects } from '@/lib/video/video-effects';

const { effects, config } = createCinematicEffects();
await effects.applyEffects('video.mp4', config);
```

### 3. Film Noir
```typescript
import { createNoirEffects } from '@/lib/video/video-effects';

const { effects, config } = createNoirEffects();
await effects.applyEffects('video.mp4', config);
```

### 4. Cores Vibrantes
```typescript
import { createVibrantEffects } from '@/lib/video/video-effects';

const { effects, config } = createVibrantEffects();
await effects.applyEffects('video.mp4', config);
```

### 5. Slow Motion
```typescript
import { createSlowMotionEffects } from '@/lib/video/video-effects';

// 50% da velocidade normal (2x mais lento)
const { effects, config } = createSlowMotionEffects(0.5);
await effects.applyEffects('video.mp4', config);
```

---

## 🎨 Filtros de Cor

### Lista Completa
- `'grayscale'` - Preto e branco
- `'sepia'` - Tom sépia vintage
- `'vintage'` - Efeito retrô
- `'cinema'` - Look cinematográfico
- `'warm'` - Tons quentes
- `'cool'` - Tons frios
- `'vibrant'` - Cores vibrantes
- `'faded'` - Cores desbotadas
- `'noir'` - Film noir

### Exemplo
```typescript
await effects.applyEffects('input.mp4', {
  colorFilter: {
    type: 'cinema',
    intensity: 0.9  // 0.0 a 1.0
  }
});
```

---

## 🎨 Correção de Cor

```typescript
await effects.applyEffects('input.mp4', {
  colorCorrection: {
    brightness: 0.2,    // -1 a 1 (+20%)
    contrast: 0.15,     // -1 a 1 (+15%)
    saturation: 1.3,    // 0 a 2 (130%)
    hue: 15,            // -180 a 180 graus
    gamma: 1.2          // 0.1 a 10
  }
});
```

---

## ✨ Efeitos Especiais

### Tipos Disponíveis
- `'blur'` - Desfoque
- `'sharpen'` - Nitidez
- `'glow'` - Brilho/Glow
- `'vignette'` - Vinheta
- `'edge-detect'` - Detecção de bordas
- `'emboss'` - Relevo
- `'cartoon'` - Cartoon/HQ
- `'oil-paint'` - Pintura a óleo
- `'noise'` - Ruído/Grão

### Exemplo Único
```typescript
await effects.applyEffects('input.mp4', {
  specialEffects: [
    { type: 'blur', radius: 10 }
  ]
});
```

### Múltiplos Efeitos
```typescript
await effects.applyEffects('input.mp4', {
  specialEffects: [
    { type: 'sharpen', intensity: 0.5 },
    { type: 'vignette', intensity: 0.6 }
  ]
});
```

---

## ⏱️ Efeitos Temporais

### Slow Motion
```typescript
await effects.applyEffects('input.mp4', {
  temporalEffect: {
    type: 'slow-motion',
    speed: 0.5  // 50% = metade da velocidade
  }
});
```

### Time Lapse
```typescript
await effects.applyEffects('input.mp4', {
  temporalEffect: {
    type: 'time-lapse',
    speed: 2.0  // 2x mais rápido
  }
});
```

### Reverso
```typescript
await effects.applyEffects('input.mp4', {
  temporalEffect: {
    type: 'reverse'
  }
});
```

---

## 🔀 Transições

### Tipos
- `'fade'` - Fade gradual
- `'dissolve'` - Dissolve
- `'wipe-left'` - Wipe esquerda
- `'wipe-right'` - Wipe direita
- `'wipe-up'` - Wipe cima
- `'wipe-down'` - Wipe baixo
- `'slide-left'` - Deslizar esquerda
- `'slide-right'` - Deslizar direita
- `'zoom-in'` - Zoom in
- `'zoom-out'` - Zoom out
- `'circle'` - Abertura circular

### Exemplo
```typescript
await effects.addTransition(
  'video1.mp4',
  'video2.mp4',
  {
    type: 'fade',
    duration: 2.0,  // 2 segundos
    offset: 0       // Início do vídeo
  },
  'output.mp4'
);
```

---

## 📱 Split Screen

### Layouts
- `'2-horizontal'` - 2 vídeos lado a lado
- `'2-vertical'` - 2 vídeos empilhados
- `'3-grid'` - 3 vídeos em grade
- `'4-grid'` - 4 vídeos em grade 2x2

### Exemplo
```typescript
await effects.createSplitScreen(
  {
    videos: [
      'video1.mp4',
      'video2.mp4',
      'video3.mp4',
      'video4.mp4'
    ],
    layout: '4-grid',
    gap: 2  // Espaçamento em pixels
  },
  'split_output.mp4'
);
```

---

## 📺 Picture-in-Picture

```typescript
await effects.applyEffects('main_video.mp4', {
  pictureInPicture: {
    overlayPath: 'overlay.mp4',
    x: '85%',           // Posição X (px ou %)
    y: '10%',           // Posição Y (px ou %)
    width: 320,         // Largura em pixels
    height: 180,        // Altura em pixels
    opacity: 1.0,       // 0 a 1
    startTime: 5,       // Começar aos 5s
    duration: 30        // Durar 30s
  }
});
```

---

## 🎛️ Opções de Processamento

```typescript
await effects.applyEffects('input.mp4', config, {
  outputPath: 'output.mp4',
  
  // Codec de vídeo
  videoCodec: 'libx265',  // ou 'libx264', 'libvpx-vp9'
  
  // Qualidade (CRF)
  crf: 20,  // 0-51 (menor = melhor qualidade)
  
  // Preset de velocidade
  preset: 'slow',  // ultrafast, fast, medium, slow, slower
  
  // Resolução
  resolution: {
    width: 1920,
    height: 1080
  },
  
  // FPS
  fps: 30,
  
  // Áudio
  audioCodec: 'aac',
  audioBitrate: '192k'
});
```

---

## 📊 Monitorar Progresso

```typescript
const effects = new VideoEffects();

// Eventos
effects.on('start', (data) => {
  console.log('Iniciando processamento...');
  console.log('Efeitos:', data.effects);
});

effects.on('progress', ({ percent, fps, speed }) => {
  console.log(`Progresso: ${percent.toFixed(1)}%`);
  console.log(`FPS: ${fps}, Velocidade: ${speed}`);
});

effects.on('complete', (result) => {
  console.log('Concluído!');
  console.log('Arquivo:', result.outputPath);
  console.log('Tempo:', result.processingTime + 'ms');
});

effects.on('error', (error) => {
  console.error('Erro:', error.message);
});

// Processar
await effects.applyEffects('input.mp4', config);
```

---

## 🔥 Combinação de Efeitos

```typescript
const effects = new VideoEffects();

await effects.applyEffects('input.mp4', {
  // Filtro de cor
  colorFilter: {
    type: 'cinema',
    intensity: 0.9
  },
  
  // Ajustes finos
  colorCorrection: {
    brightness: 0.05,
    contrast: 0.15,
    saturation: 1.1
  },
  
  // Efeitos especiais
  specialEffects: [
    { type: 'sharpen', intensity: 0.3 },
    { type: 'vignette', intensity: 0.4 }
  ],
  
  // Câmera lenta
  temporalEffect: {
    type: 'slow-motion',
    speed: 0.75  // 25% mais lento
  }
}, {
  outputPath: 'resultado_final.mp4',
  videoCodec: 'libx265',
  preset: 'slow',
  crf: 18,
  resolution: { width: 1920, height: 1080 },
  fps: 30
});
```

---

## 💡 Dicas Práticas

### 1. Performance
- Use `preset: 'fast'` para testes rápidos
- Use `preset: 'slow'` para produção final
- Use CRF 18-23 para boa qualidade

### 2. Qualidade
- CRF 18 = Qualidade excelente (arquivo grande)
- CRF 23 = Qualidade boa (arquivo médio)
- CRF 28 = Qualidade aceitável (arquivo pequeno)

### 3. Combinações Recomendadas

**Para cursos educacionais:**
```typescript
{
  colorFilter: { type: 'cinema', intensity: 0.8 },
  colorCorrection: { 
    brightness: 0.05, 
    contrast: 0.1,
    saturation: 1.05
  },
  specialEffects: [
    { type: 'sharpen', intensity: 0.2 }
  ]
}
```

**Para vídeos dramáticos:**
```typescript
{
  colorFilter: { type: 'noir', intensity: 1.0 },
  colorCorrection: { 
    contrast: 0.3,
    brightness: -0.05
  },
  specialEffects: [
    { type: 'vignette', intensity: 0.6 }
  ]
}
```

**Para vídeos alegres:**
```typescript
{
  colorFilter: { type: 'vibrant', intensity: 1.0 },
  colorCorrection: { 
    saturation: 1.4,
    brightness: 0.1
  }
}
```

---

## ❓ Troubleshooting

### Erro: "Input file not found"
- Verifique se o caminho do arquivo está correto
- Use caminhos absolutos quando possível

### Erro: "FFmpeg not available"
- Certifique-se que FFmpeg está instalado
- Adicione FFmpeg ao PATH do sistema

### Processamento Lento
- Use preset mais rápido (`fast` ou `medium`)
- Reduza a resolução para testes
- Aumente CRF (qualidade menor, mais rápido)

### Qualidade Ruim
- Diminua CRF (18-20 para alta qualidade)
- Use preset `slow` ou `slower`
- Verifique bitrate de áudio

---

## 📚 Recursos

- **Código:** `app/lib/video/video-effects.ts`
- **Testes:** `app/__tests__/lib/video/video-effects.test.ts`
- **Relatório:** `VIDEO_EFFECTS_REPORT_10_OUT_2025.md`

---

**Documentação completa:** VIDEO_EFFECTS_REPORT_10_OUT_2025.md  
**Versão:** 1.0.0  
**Status:** ✅ Production Ready
