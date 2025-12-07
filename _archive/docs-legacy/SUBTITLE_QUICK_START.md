# 🚀 Guia Rápido - Sistema de Legendas
## Comece em 5 Minutos

---

## 📦 Instalação

```bash
# 1. Copiar o arquivo para seu projeto
cp estudio_ia_videos/app/lib/video/subtitle-manager.ts seu-projeto/lib/

# 2. Instalar dependências
npm install fluent-ffmpeg
npm install --save-dev @types/fluent-ffmpeg
```

---

## ⚡ Início Rápido (3 Cenários)

### 1️⃣ Cenário: Curso Online Simples

```typescript
import { createCourseSubtitleManager } from './lib/video/subtitle-manager';

// Criar gerenciador otimizado para cursos
const manager = createCourseSubtitleManager();

// Criar faixa em português
const trackId = manager.createTrack('pt-BR', 'Português', true);

// Adicionar legendas
manager.addEntry(trackId, {
  startTime: 0,
  endTime: 5,
  text: 'Bem-vindo ao Módulo 1!'
});

manager.addEntry(trackId, {
  startTime: 5.5,
  endTime: 12,
  text: 'Nesta aula você aprenderá TypeScript'
});

// Exportar para arquivo SRT
await manager.export({
  trackId,
  format: 'srt',
  outputPath: './legendas/aula01.srt'
});

console.log('✅ Legendas criadas!');
```

**Resultado:**
```
aula01.srt criado com:
- Fonte amarela, negrito
- Validação automática
- Formato SRT padrão
```

---

### 2️⃣ Cenário: Vídeo Multi-Idioma

```typescript
import { createMultiLanguageSubtitleManager } from './lib/video/subtitle-manager';

// Criar gerenciador com 3 idiomas pré-configurados
const manager = createMultiLanguageSubtitleManager();

// Obter faixas
const tracks = manager.getAllTracks();
const ptTrack = tracks.find(t => t.language === 'pt-BR')!;
const enTrack = tracks.find(t => t.language === 'en-US')!;
const esTrack = tracks.find(t => t.language === 'es-ES')!;

// Adicionar mesmas legendas em 3 idiomas
manager.addEntry(ptTrack.id, {
  startTime: 0,
  endTime: 5,
  text: 'Olá! Como vai?'
});

manager.addEntry(enTrack.id, {
  startTime: 0,
  endTime: 5,
  text: 'Hello! How are you?'
});

manager.addEntry(esTrack.id, {
  startTime: 0,
  endTime: 5,
  text: '¡Hola! ¿Cómo estás?'
});

// Exportar todos os idiomas
await manager.export({
  trackId: ptTrack.id,
  format: 'vtt',
  outputPath: './legendas/video_pt.vtt'
});

await manager.export({
  trackId: enTrack.id,
  format: 'vtt',
  outputPath: './legendas/video_en.vtt'
});

await manager.export({
  trackId: esTrack.id,
  format: 'vtt',
  outputPath: './legendas/video_es.vtt'
});

console.log('✅ 3 arquivos VTT criados!');
```

**Resultado:**
```
✅ video_pt.vtt
✅ video_en.vtt
✅ video_es.vtt
```

---

### 3️⃣ Cenário: Burn-in em Vídeo

```typescript
import { createBasicSubtitleManager } from './lib/video/subtitle-manager';

// Criar gerenciador básico
const manager = createBasicSubtitleManager();
const trackId = manager.createTrack('pt-BR', 'Português', true);

// Adicionar legendas
manager.addEntry(trackId, {
  startTime: 0,
  endTime: 5,
  text: 'Introdução ao curso'
});

manager.addEntry(trackId, {
  startTime: 5.5,
  endTime: 10,
  text: 'Apresentação do instrutor'
});

// Incorporar legendas PERMANENTEMENTE no vídeo
const result = await manager.embedSubtitles({
  videoPath: './videos/aula.mp4',
  outputPath: './videos/aula_legendado.mp4',
  trackId,
  burnIn: true,  // Legendas permanentes!
  codec: 'libx264',
  preset: 'medium'
});

console.log(`✅ Vídeo criado: ${result.outputPath}`);
console.log(`📦 Tamanho: ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);
```

**Resultado:**
```
✅ Vídeo criado: ./videos/aula_legendado.mp4
📦 Tamanho: 42.5 MB
```

---

## 🎯 Casos de Uso Rápidos

### 📥 Importar SRT Existente

```typescript
const manager = new SubtitleManager();
const trackId = manager.createTrack('pt-BR', 'Português', true);

// Importar arquivo SRT
const count = await manager.importSRT('./legendas/existente.srt', trackId);

console.log(`✅ ${count} entradas importadas`);

// Validar qualidade
const validation = manager.validateTrack(trackId);

if (!validation.isValid) {
  console.log('❌ Erros encontrados:');
  validation.errors.forEach(e => console.log(`  - ${e.message}`));
}
```

---

### 🔄 Sincronizar Legendas Dessincronizadas

```typescript
const manager = new SubtitleManager();
const trackId = manager.createTrack('pt-BR', 'Português', true);

// Importar legendas dessincronizadas
await manager.importSRT('./legendas/dessincronizado.srt', trackId);

// Atrasar 2 segundos
manager.syncTrack(trackId, { offset: 2.0 });

// Ou ajustar velocidade (vídeo 5% mais rápido)
manager.syncTrack(trackId, { speedFactor: 0.95 });

// Exportar corrigido
await manager.export({
  trackId,
  format: 'srt',
  outputPath: './legendas/sincronizado.srt'
});
```

---

### ✅ Validar Qualidade de Legendas

```typescript
const manager = new SubtitleManager();
const trackId = manager.createTrack('pt-BR', 'Português', true);

// Importar legendas
await manager.importSRT('./legendas/para_validar.srt', trackId);

// Validação rigorosa
const validation = manager.validateTrack(trackId, {
  checkOverlaps: true,        // Sobreposições
  checkGaps: true,            // Gaps grandes
  maxGapDuration: 3.0,        // Máx 3 segundos
  checkDuration: true,        // Duração válida
  minDuration: 1.0,           // Mín 1 segundo
  maxDuration: 10.0,          // Máx 10 segundos
  checkTextLength: true,      // Comprimento de texto
  maxCharsPerLine: 42,        // Máx 42 chars/linha
  maxLines: 2                 // Máx 2 linhas
});

// Relatório
if (validation.isValid) {
  console.log('✅ Legendas validadas com sucesso!');
} else {
  console.log('❌ Problemas encontrados:');
  
  validation.errors.forEach(error => {
    console.log(`  [ERRO] ${error.message} (Linha ${error.line})`);
  });
  
  validation.warnings.forEach(warning => {
    console.log(`  [AVISO] ${warning.message}`);
  });
}
```

---

### 🎨 Legendas Personalizadas com Estilo

```typescript
const manager = new SubtitleManager();
const trackId = manager.createTrack('pt-BR', 'Português', true);

// Adicionar com estilo customizado
manager.addEntry(trackId, {
  startTime: 0,
  endTime: 5,
  text: 'Título Importante',
  style: {
    fontName: 'Roboto',
    fontSize: 32,
    bold: true,
    italic: false,
    primaryColor: '#FF0000',    // Vermelho
    outlineColor: '#FFFFFF',    // Contorno branco
    outlineWidth: 3,
    shadowDepth: 2,
    opacity: 95
  },
  position: 'top-center',       // Posição superior
  effect: {
    type: 'fade-in-out',
    duration: 0.5
  }
});

// Exportar para ASS (suporta todos os estilos)
await manager.export({
  trackId,
  format: 'ass',
  outputPath: './legendas/estilizado.ass'
});
```

---

### 🌍 Acessibilidade (WCAG Compliance)

```typescript
import { createAccessibleSubtitleManager } from './lib/video/subtitle-manager';

// Manager otimizado para acessibilidade
const manager = createAccessibleSubtitleManager();
const trackId = manager.getDefaultTrack()!.id;

// Adicionar legendas
manager.addEntry(trackId, {
  startTime: 0,
  endTime: 3,
  text: '[Música instrumental de fundo]'
});

manager.addEntry(trackId, {
  startTime: 3.5,
  endTime: 8,
  text: 'Narrador explica conceito'
});

// Validação rigorosa automática
const validation = manager.validateTrack(trackId);

if (validation.isValid) {
  // Exportar em formato acessível
  await manager.export({
    trackId,
    format: 'vtt',
    outputPath: './legendas/acessivel.vtt'
  });
  
  console.log('✅ Legendas acessíveis criadas!');
  console.log('   - Alto contraste ✓');
  console.log('   - Fonte grande (32px) ✓');
  console.log('   - Fundo semi-transparente ✓');
  console.log('   - WCAG 2.1 AA compliant ✓');
}
```

---

## 🎭 Factory Functions (Atalhos)

### 1. Basic (Uso Geral)
```typescript
import { createBasicSubtitleManager } from './lib/video/subtitle-manager';

const manager = createBasicSubtitleManager();
// Configuração padrão, sem validação automática
```

### 2. Course (Cursos Online)
```typescript
import { createCourseSubtitleManager } from './lib/video/subtitle-manager';

const manager = createCourseSubtitleManager();
// Amarelo, negrito, validação rigorosa
```

### 3. Multi-Language (Multi-Idioma)
```typescript
import { createMultiLanguageSubtitleManager } from './lib/video/subtitle-manager';

const manager = createMultiLanguageSubtitleManager();
// 3 faixas pré-criadas: pt-BR, en-US, es-ES
```

### 4. Accessible (Acessibilidade)
```typescript
import { createAccessibleSubtitleManager } from './lib/video/subtitle-manager';

const manager = createAccessibleSubtitleManager();
// WCAG 2.1 AA, alto contraste, fonte grande
```

---

## 🎬 Formatos Suportados

### SRT (SubRip)
**Melhor para:** Compatibilidade universal

```typescript
await manager.export({
  trackId,
  format: 'srt',
  outputPath: './output.srt',
  includeFormatting: true  // Tags HTML: <b>, <i>, <u>
});
```

**Exemplo:**
```
1
00:00:00,000 --> 00:00:05,000
<b>Introdução</b>

2
00:00:05,500 --> 00:00:10,000
Bem-vindo ao <i>curso</i>
```

---

### VTT (WebVTT)
**Melhor para:** HTML5 video, navegadores

```typescript
await manager.export({
  trackId,
  format: 'vtt',
  outputPath: './output.vtt'
});
```

**Exemplo:**
```
WEBVTT

00:00:00.000 --> 00:00:05.000 align:middle
<b>Introdução</b>

00:00:05.500 --> 00:00:10.000 align:start position:10%
Bem-vindo ao curso
```

---

### ASS (Advanced SubStation Alpha)
**Melhor para:** Estilos complexos, anime, cinema

```typescript
await manager.export({
  trackId,
  format: 'ass',
  outputPath: './output.ass'
});
```

**Exemplo:**
```
[Script Info]
Title: Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, ...
Style: Default,Arial,24,&H00FFFFFF,...

[Events]
Format: Layer, Start, End, Style, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,{\b1}Introdução{\b0}
```

---

## 🎯 Eventos Disponíveis

```typescript
const manager = new SubtitleManager();

// Track events
manager.on('track:created', (track) => {
  console.log(`Faixa criada: ${track.label}`);
});

manager.on('track:removed', (trackId) => {
  console.log(`Faixa removida: ${trackId}`);
});

// Entry events
manager.on('entry:added', (data) => {
  console.log(`Entrada ${data.entryId} adicionada à faixa ${data.trackId}`);
});

manager.on('entry:updated', (data) => {
  console.log(`Entrada ${data.entryId} atualizada`);
});

// Export events
manager.on('export:complete', (result) => {
  console.log(`Exportação concluída: ${result.path}`);
});

// Embed events
manager.on('embed:start', (data) => {
  console.log(`Iniciando embed: ${data.videoPath}`);
});

manager.on('embed:progress', (progress) => {
  console.log(`Progresso: ${progress.percent}%`);
});

manager.on('embed:complete', (result) => {
  console.log(`Embed concluído: ${result.outputPath}`);
});

// Validation events
manager.on('track:validated', (result) => {
  if (!result.isValid) {
    console.log(`Validação falhou: ${result.errors.length} erros`);
  }
});
```

---

## ⚠️ Troubleshooting

### Problema: Legendas dessincronizadas

**Solução:**
```typescript
// Atrasar legendas em 2 segundos
manager.syncTrack(trackId, { offset: 2.0 });

// Ou ajustar velocidade
manager.syncTrack(trackId, { speedFactor: 1.05 });
```

---

### Problema: Texto muito longo

**Solução:**
```typescript
// Validar antes de exportar
const validation = manager.validateTrack(trackId, {
  checkTextLength: true,
  maxCharsPerLine: 42,
  maxLines: 2
});

if (!validation.isValid) {
  // Editar entradas problemáticas
  validation.errors.forEach(error => {
    if (error.code === 'TEXT_TOO_LONG') {
      // Dividir em 2 entradas ou reduzir texto
    }
  });
}
```

---

### Problema: FFmpeg não encontrado

**Solução:**
```bash
# Windows (com Chocolatey)
choco install ffmpeg

# macOS
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt install ffmpeg

# Verificar instalação
ffmpeg -version
```

---

### Problema: Encoding incorreto

**Solução:**
```typescript
await manager.export({
  trackId,
  format: 'srt',
  outputPath: './output.srt',
  encoding: 'utf-8'  // ou 'utf-16le', 'latin1', etc
});
```

---

## 📚 Referência Rápida de API

### Constructor
```typescript
new SubtitleManager(config?: Partial<SubtitleManagerConfig>)
```

### Track Management
```typescript
createTrack(language: string, label: string, isDefault?: boolean): string
removeTrack(trackId: string): boolean
getTrack(trackId: string): SubtitleTrack | undefined
getAllTracks(): SubtitleTrack[]
getDefaultTrack(): SubtitleTrack | undefined
```

### Entry Management
```typescript
addEntry(trackId: string, entry: Omit<SubtitleEntry, 'id'>): number
removeEntry(trackId: string, entryId: number): boolean
updateEntry(trackId: string, entryId: number, updates: Partial<SubtitleEntry>): boolean
getEntriesInRange(trackId: string, startTime: number, endTime: number): SubtitleEntry[]
```

### Synchronization
```typescript
syncTrack(trackId: string, config: SyncConfig): void
adjustEntryTiming(trackId: string, entryId: number, startOffset: number, endOffset: number): boolean
```

### Validation
```typescript
validateTrack(trackId: string, options?: ValidationOptions): ValidationResult
```

### Import/Export
```typescript
importSRT(filePath: string, trackId: string): Promise<number>
export(options: ExportOptions): Promise<string>
embedSubtitles(options: EmbedOptions): Promise<EmbedResult>
```

### Utilities
```typescript
clearAllTracks(): void
getTotalEntriesCount(): number
getConfig(): SubtitleManagerConfig
updateConfig(config: Partial<SubtitleManagerConfig>): void
```

---

## 🎓 Próximos Passos

1. **Explorar exemplos** nos testes: `subtitle-manager.test.ts`
2. **Ler documentação completa**: `SUBTITLE_SYSTEM_REPORT_FINAL.md`
3. **Testar com seus vídeos**: Comece com factory functions
4. **Experimentar estilos**: Crie legendas personalizadas
5. **Contribuir**: Reporte bugs ou sugira features

---

## 📞 Suporte

**Issues**: Para bugs e sugestões
**Testes**: 57 exemplos em `subtitle-manager.test.ts`
**Docs**: Relatório completo disponível

---

**Versão:** 1.0.0  
**Atualizado:** 10/10/2025  
**Status:** ✅ Produção Pronto

