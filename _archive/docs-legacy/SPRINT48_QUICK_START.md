# 🚀 Sprint 48 - Guia Rápido de Uso

**4 Sistemas Avançados de Renderização em 5 Minutos**

---

## 📋 Índice Rápido

1. [Marcas d'Água](#1-marcas-dágua-watermark)
2. [Legendas](#2-legendas-subtitles)
3. [Filtros de Vídeo](#3-filtros-de-vídeo)
4. [Processamento de Áudio](#4-processamento-de-áudio)

---

## 1. Marcas d'Água (Watermark)

### ⚡ Uso Rápido - Preset

```typescript
import { watermarkRenderer, WatermarkPresets } from '@/lib/export/watermark-renderer'

// Logo no canto inferior direito
const preset = WatermarkPresets.LOGO_BOTTOM_RIGHT
await watermarkRenderer.applyWatermark('video.mp4', preset)
```

### 🎨 Personalizado - Imagem

```typescript
const watermark = {
  type: 'image',
  imagePath: '/logo.png',
  position: WatermarkPosition.BOTTOM_RIGHT,
  opacity: 0.8,
  padding: { right: 20, bottom: 20 }
}

await watermarkRenderer.applyWatermark('video.mp4', watermark)
```

### ✍️ Personalizado - Texto

```typescript
const watermark = {
  type: 'text',
  text: '© 2024 Minha Empresa',
  position: WatermarkPosition.BOTTOM_CENTER,
  style: {
    fontSize: 24,
    fontColor: '#FFFFFF',
    backgroundColor: '#00000080'
  }
}

await watermarkRenderer.applyWatermark('video.mp4', watermark)
```

### 🎬 Com Animação

```typescript
const watermark = {
  type: 'image',
  imagePath: '/logo.png',
  position: WatermarkPosition.TOP_RIGHT,
  animation: {
    type: WatermarkAnimation.FADE,
    duration: 2,
    startTime: 0
  }
}
```

**Posições disponíveis**: 9 opções (TOP_LEFT, TOP_CENTER, TOP_RIGHT, MIDDLE_LEFT, CENTER, MIDDLE_RIGHT, BOTTOM_LEFT, BOTTOM_CENTER, BOTTOM_RIGHT)

**Animações**: NONE, FADE, SLIDE, ZOOM, PULSE, ROTATE

---

## 2. Legendas (Subtitles)

### ⚡ Uso Rápido - Aplicar SRT

```typescript
import { subtitleRenderer } from '@/lib/export/subtitle-renderer'

await subtitleRenderer.renderSubtitles('video.mp4', 'legendas.srt')
```

### 📝 Converter Formatos

```typescript
import { subtitleParser, SubtitleFormat } from '@/lib/export/subtitle-parser'

// Carregar SRT
const srt = fs.readFileSync('legendas.srt', 'utf-8')
const subtitles = subtitleParser.parse(srt, SubtitleFormat.SRT)

// Converter para VTT
const vtt = subtitleParser.convert(subtitles, SubtitleFormat.VTT)

// Salvar
fs.writeFileSync('legendas.vtt', vtt.content)
```

### 🎨 Estilizar Legendas

```typescript
await subtitleRenderer.renderSubtitles('video.mp4', 'legendas.srt', {
  burnIn: true,
  style: {
    fontName: 'Arial',
    fontSize: 28,
    primaryColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 2,
    shadowDepth: 1,
    alignment: 'center'
  }
})
```

### 🔍 Detectar Formato Automaticamente

```typescript
const content = fs.readFileSync('legendas.txt', 'utf-8')
const format = subtitleParser.detectFormat(content)
console.log('Formato:', format) // 'srt', 'vtt', ou 'ass'
```

### 🤖 Gerar Legendas Automáticas

```typescript
const text = 'Bem-vindo ao curso. Hoje vamos aprender...'
const subtitles = subtitleParser.generate(text, 60) // 60 segundos
```

**Formatos suportados**: SRT, VTT, ASS

---

## 3. Filtros de Vídeo

### ⚡ Uso Rápido - Preset

```typescript
import { VideoFilters } from '@/lib/export/video-filters'

// Aplicar preset cinematográfico
const presets = VideoFilters.getPresets()
const cinematic = presets.find(p => p.id === 'cinematic')

await videoFilters.applyFilters('input.mp4', 'output.mp4', cinematic.filters)
```

### 🎨 Filtros Individuais

```typescript
import { VideoFilterType } from '@/lib/export/video-filters'

const filters = [
  { type: VideoFilterType.BRIGHTNESS, value: 0.1, enabled: true },
  { type: VideoFilterType.CONTRAST, value: 0.15, enabled: true },
  { type: VideoFilterType.SATURATION, value: 1.3, enabled: true }
]

await videoFilters.applyFilters('input.mp4', 'output.mp4', filters)
```

### 🌟 Efeitos Especiais

```typescript
// Sépia vintage
const vintage = [
  { type: VideoFilterType.SEPIA, value: 1.0, enabled: true },
  { type: VideoFilterType.VIGNETTE, value: { angle: 90, intensity: 0.5 }, enabled: true }
]

// Preto e branco dramático
const bw = [
  { type: VideoFilterType.GRAYSCALE, value: 1.0, enabled: true },
  { type: VideoFilterType.CONTRAST, value: 0.3, enabled: true }
]

// Desfoque artístico
const blur = [
  { type: VideoFilterType.BLUR, value: 8, enabled: true },
  { type: VideoFilterType.BRIGHTNESS, value: 0.1, enabled: true }
]
```

**Presets disponíveis**: 
- `cinematic` - Efeito de filme
- `vintage` - Retrô com sépia
- `vivid` - Cores vibrantes
- `black-white` - P&B clássico
- `soft-blur` - Desfoque suave
- `sharp-hd` - Nitidez HD

**Filtros disponíveis**: BRIGHTNESS, CONTRAST, SATURATION, HUE, BLUR, SHARPEN, SEPIA, GRAYSCALE, VIGNETTE, FADE, COLORIZE, NOISE, DENOISE

---

## 4. Processamento de Áudio

### ⚡ Uso Rápido - Preset

```typescript
import { AudioProcessor } from '@/lib/export/audio-processor'

// Otimizar para podcast
const presets = AudioProcessor.getPresets()
const podcast = presets.find(p => p.id === 'podcast')

await audioProcessor.processAudio('input.mp4', 'output.mp4', podcast.enhancements)
```

### 🎙️ Normalização

```typescript
import { AudioEnhancementType } from '@/lib/export/audio-processor'

const enhancements = [
  {
    type: AudioEnhancementType.NORMALIZE,
    value: { targetLevel: -16, method: 'ebu' },
    enabled: true
  }
]

await audioProcessor.processAudio('input.mp4', 'output.mp4', enhancements)
```

### 🎚️ Compressão e EQ

```typescript
const enhancements = [
  // Normalizar primeiro
  {
    type: AudioEnhancementType.NORMALIZE,
    value: { targetLevel: -16, method: 'ebu' },
    enabled: true
  },
  // Depois comprimir
  {
    type: AudioEnhancementType.COMPRESSION,
    value: { threshold: -20, ratio: 4, attack: 5, release: 50 },
    enabled: true
  },
  // Equalizar para voz
  {
    type: AudioEnhancementType.EQUALIZER,
    value: { bass: -2, mid: 4, treble: 1 },
    enabled: true
  }
]
```

### 🔇 Redução de Ruído

```typescript
const enhancements = [
  {
    type: AudioEnhancementType.NOISE_REDUCTION,
    value: { strength: 0.7 }, // 0 a 1
    enabled: true
  }
]
```

### 📊 Analisar Áudio Primeiro

```typescript
const analysis = await audioProcessor.analyzeAudio('input.mp4')

console.log('Volume médio:', analysis.meanVolume)
console.log('Volume máximo:', analysis.maxVolume)
console.log('Precisa normalizar?', analysis.needsNormalization)

// Se precisar normalizar
if (analysis.needsNormalization) {
  const targetLevel = -16 // LUFS
  // ... aplicar normalização
}
```

**Presets disponíveis**:
- `podcast` - Voz clara, sem ruído
- `music` - Equalização balanceada
- `voice-clarity` - Enfatiza voz
- `broadcast` - Padrão de transmissão

**Processamentos disponíveis**: NORMALIZE, COMPRESSION, NOISE_REDUCTION, FADE_IN, FADE_OUT, EQUALIZER, BASS_BOOST, TREBLE_BOOST, VOLUME, DUCKING

---

## 🔄 Pipeline Completo

### Processar Tudo de Uma Vez

```typescript
import { watermarkRenderer } from '@/lib/export/watermark-renderer'
import { subtitleRenderer } from '@/lib/export/subtitle-renderer'
import { videoFilters } from '@/lib/export/video-filters'
import { audioProcessor } from '@/lib/export/audio-processor'

async function processVideo(inputPath: string) {
  // 1. Processar áudio
  await audioProcessor.processAudio(
    inputPath,
    'temp_audio.mp4',
    AudioProcessor.getPresets().find(p => p.id === 'podcast')!.enhancements
  )

  // 2. Aplicar filtros de vídeo
  await videoFilters.applyFilters(
    'temp_audio.mp4',
    'temp_filters.mp4',
    VideoFilters.getPresets().find(p => p.id === 'cinematic')!.filters
  )

  // 3. Adicionar legendas
  await subtitleRenderer.renderSubtitles(
    'temp_filters.mp4',
    'legendas.srt'
  )

  // 4. Adicionar marca d'água
  await watermarkRenderer.applyWatermark(
    'temp_filters.mp4',
    {
      type: 'image',
      imagePath: 'logo.png',
      position: WatermarkPosition.BOTTOM_RIGHT,
      opacity: 0.8
    }
  )

  console.log('✅ Processamento completo!')
}
```

---

## 🎨 Componentes React

### Usar na UI

```tsx
import { WatermarkSettings } from '@/components/export/WatermarkSettings'
import { VideoFiltersSettings } from '@/components/export/VideoFiltersSettings'
import { AudioEnhancementSettings } from '@/components/export/AudioEnhancementSettings'

function VideoExportDialog() {
  const [watermark, setWatermark] = useState(null)
  const [filters, setFilters] = useState([])
  const [audio, setAudio] = useState([])

  return (
    <Dialog>
      <Tabs>
        <TabsContent value="watermark">
          <WatermarkSettings 
            watermark={watermark} 
            onChange={setWatermark} 
          />
        </TabsContent>

        <TabsContent value="filters">
          <VideoFiltersSettings 
            filters={filters} 
            onChange={setFilters} 
          />
        </TabsContent>

        <TabsContent value="audio">
          <AudioEnhancementSettings 
            enhancements={audio} 
            onChange={setAudio} 
          />
        </TabsContent>
      </Tabs>

      <Button onClick={() => processVideo()}>
        Exportar Vídeo
      </Button>
    </Dialog>
  )
}
```

---

## 📊 Valores Recomendados

### Marcas d'Água
- **Opacidade**: 70-90% para imagens, 80-100% para texto
- **Tamanho**: 10-15% da largura do vídeo
- **Posição**: Cantos para logos, centro inferior para copyright

### Filtros de Vídeo
- **Brightness**: -0.2 a +0.2 (pequenos ajustes)
- **Contrast**: 0 a +0.3 (evitar valores negativos)
- **Saturation**: 0.8 a 1.5 (1.0 = original)
- **Blur**: 3-8px para efeito suave
- **Sharpen**: 0.5-1.5 (evitar > 2.0)

### Áudio
- **Normalização**: -16 LUFS (podcast), -14 LUFS (música), -23 LUFS (broadcast)
- **Compressão**: Ratio 3-6:1, Threshold -18 a -24 dB
- **Redução de Ruído**: 40-60% de intensidade
- **EQ para Voz**: Bass -2dB, Mid +3dB, Treble +1dB

---

## ⚠️ Dicas Importantes

### Performance
- Processe vídeos em etapas separadas se houver problemas de memória
- Use presets quando possível (mais rápido)
- Evite aplicar muitos filtros ao mesmo tempo (>5)

### Qualidade
- Sempre normalize áudio ANTES de comprimir
- Use legendas com outline para melhor legibilidade
- Teste marcas d'água em diferentes resoluções
- Aplique filtros com moderação

### Debugging
- Use `onProgress` callback para monitorar
- Verifique logs do console FFmpeg
- Teste com vídeos curtos (10-30s) primeiro

---

## 📚 Referências Rápidas

### Imports Principais

```typescript
// Watermark
import { watermarkRenderer, WatermarkPosition, WatermarkAnimation } from '@/lib/export/watermark-renderer'

// Subtitles
import { subtitleParser, subtitleRenderer, SubtitleFormat } from '@/lib/export/subtitle-parser'

// Video Filters
import { videoFilters, VideoFilterType } from '@/lib/export/video-filters'

// Audio
import { audioProcessor, AudioEnhancementType } from '@/lib/export/audio-processor'
```

### Callbacks de Progresso

```typescript
await videoFilters.applyFilters(
  input,
  output,
  filters,
  (progress) => {
    console.log(`Progresso: ${progress}%`)
    // Atualizar UI
  }
)
```

---

## 🎯 Casos de Uso Comuns

### 1. Vídeo Corporativo
```typescript
// Logo + Normalização de áudio + Filtro cinematográfico
```

### 2. Tutorial/Curso
```typescript
// Legendas + Normalização de voz + Redução de ruído
```

### 3. Vídeo de Marketing
```typescript
// Marca d'água + Cores vibrantes + Compressão de áudio
```

### 4. Podcast em Vídeo
```typescript
// Normalização -16 LUFS + Compressão + EQ para voz
```

---

**Pronto para usar! 🚀**

Veja documentação completa em: `SPRINT48_ADVANCED_RENDERING.md`
