# 🚀 Quick Start - Video Processing System

Sistema completo de processamento de vídeos com validação, análise de áudio, filas e cache.

---

## 📋 Índice

- [Instalação](#-instalação)
- [Uso Básico](#-uso-básico)
- [Exemplos Práticos](#-exemplos-práticos)
- [API Reference](#-api-reference)
- [Testes](#-testes)

---

## 🔧 Instalação

### Pré-requisitos

```bash
Node.js 20+
FFmpeg (para análise de áudio/vídeo)
Redis (opcional, para cache distribuído)
```

### Instalar Dependências

```bash
cd estudio_ia_videos/app
npm install
```

### Instalar FFmpeg

**Windows:**
```powershell
choco install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

**Mac:**
```bash
brew install ffmpeg
```

---

## 💡 Uso Básico

### 1. Validação de Vídeo

```typescript
import { VideoValidator, createNRValidator } from '@/lib/video/validator';

// Criar validador
const validator = createNRValidator();

// Validar vídeo
const result = await validator.validate('video.mp4');

if (result.valid) {
  console.log('✅ Vídeo válido!');
  console.log('Qualidade:', result.quality);
  console.log('Metadados:', result.metadata);
} else {
  console.log('❌ Erros:', result.errors);
  console.log('⚠️ Avisos:', result.warnings);
}
```

### 2. Análise de Áudio

```typescript
import { AudioAnalyzer, createNRAudioAnalyzer } from '@/lib/audio/analyzer';

// Criar analisador
const analyzer = createNRAudioAnalyzer();

// Analisar áudio
const report = await analyzer.analyze('audio.mp3');

console.log('Qualidade:', report.overall);
console.log('Score:', report.score);
console.log('Silêncios detectados:', report.silences.length);
console.log('Recomendações:', report.recommendations);

// Normalizar se necessário
if (report.needsNormalization) {
  await analyzer.normalize('input.mp3', 'output.mp3');
}
```

### 3. Fila de Processamento

```typescript
import { VideoProcessingQueue, QueuePriority } from '@/lib/video/queue-manager';

// Criar fila
const queue = new VideoProcessingQueue({
  maxConcurrent: 3,
  maxRetries: 3
});

// Registrar processador
queue.registerProcessor('transcode', async (job) => {
  const { input, output } = job.data;
  // Processar vídeo...
  return { success: true };
});

// Adicionar job
const jobId = await queue.addJob('transcode', {
  input: 'video.mp4',
  output: 'video_hd.mp4'
}, {
  priority: QueuePriority.HIGH
});

// Monitorar
queue.on('job:completed', (job, result) => {
  console.log('✅ Job concluído:', job.id);
});
```

### 4. Cache Inteligente

```typescript
import { CacheManager, getCache } from '@/lib/cache/cache-manager';

// Obter instância
const cache = getCache({
  useRedis: true,
  defaultTTL: 3600
});

// Cachear dados
await cache.set('video:123', videoData, { ttl: 7200 });

// Obter dados
const video = await cache.get('video:123');

// Cache-aside pattern
const data = await cache.getOrSet('expensive', async () => {
  return await heavyComputation();
});

// Invalidação por tag
await cache.set('user:1', data, { tags: ['users'] });
await cache.invalidateByTag('users');
```

### 5. Pipeline Completo

```typescript
import { createNRPipeline } from '@/lib/video/pipeline';

// Criar pipeline
const pipeline = createNRPipeline();

// Processar vídeo
const request = {
  id: 'video-001',
  inputPath: 'input.mp4',
  outputPath: 'output.mp4',
  options: {
    validate: true,
    analyzeAudio: true,
    normalize: true,
    removeSilence: true
  }
};

const jobId = await pipeline.processVideo(request);

// Aguardar resultado
const result = await pipeline.waitForCompletion(request.id);

console.log('Sucesso:', result.success);
console.log('Qualidade:', result.validation?.quality);
console.log('Áudio:', result.audioAnalysis?.quality);
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Processar Curso NR Completo

```typescript
import { createNRPipeline, QueuePriority } from '@/lib/video/pipeline';

async function processCourse(courseId: string, modules: string[]) {
  const pipeline = createNRPipeline();
  
  for (const [index, modulePath] of modules.entries()) {
    await pipeline.processVideo({
      id: `${courseId}-module-${index + 1}`,
      inputPath: modulePath,
      outputPath: `/courses/${courseId}/module-${index + 1}.mp4`,
      priority: QueuePriority.HIGH,
      options: {
        validate: true,
        analyzeAudio: true,
        normalize: true,
        removeSilence: true,
        watermark: '/assets/nr-watermark.png'
      },
      metadata: {
        courseId,
        moduleNumber: index + 1
      }
    });
  }
}

// Usar
await processCourse('NR12', [
  '/uploads/nr12-intro.mp4',
  '/uploads/nr12-conceitos.mp4',
  '/uploads/nr12-praticas.mp4'
]);
```

### Exemplo 2: Validação em Lote com Relatório

```typescript
import { createNRValidator } from '@/lib/video/validator';
import { createNRAudioAnalyzer } from '@/lib/audio/analyzer';

async function validateVideos(videoPaths: string[]) {
  const validator = createNRValidator();
  const analyzer = createNRAudioAnalyzer();
  
  const report = [];
  
  for (const videoPath of videoPaths) {
    const validation = await validator.validate(videoPath);
    const audioReport = validation.metadata?.hasAudio 
      ? await analyzer.analyze(videoPath)
      : null;
    
    report.push({
      file: videoPath,
      valid: validation.valid,
      videoQuality: validation.quality,
      audioQuality: audioReport?.overall || 'N/A',
      audioScore: audioReport?.score || 0,
      errors: validation.errors,
      warnings: validation.warnings,
      recommendations: audioReport?.recommendations || []
    });
  }
  
  // Gerar CSV
  const csv = generateCSV(report);
  await fs.writeFile('validation-report.csv', csv);
  
  return report;
}
```

### Exemplo 3: Pipeline com Webhooks

```typescript
import { createNRPipeline } from '@/lib/video/pipeline';

async function setupPipelineWithWebhooks(webhookUrl: string) {
  const pipeline = createNRPipeline();
  
  // Notificar quando completar
  pipeline.on('processing:completed', async (requestId, result) => {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'video.processed',
        requestId,
        success: result.success,
        quality: result.validation?.quality,
        audioScore: result.audioAnalysis?.score,
        outputPath: result.output?.path
      })
    });
  });
  
  // Notificar falhas
  pipeline.on('processing:failed', async (requestId, error) => {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'video.failed',
        requestId,
        error: error.message
      })
    });
  });
  
  return pipeline;
}
```

---

## 📚 API Reference

### VideoValidator

```typescript
class VideoValidator {
  constructor(options?: ValidationOptions)
  validate(filePath: string): Promise<ValidationResult>
  validateBatch(filePaths: string[]): Promise<Map<string, ValidationResult>>
}
```

### AudioAnalyzer

```typescript
class AudioAnalyzer {
  constructor(options?: AudioAnalysisOptions)
  analyze(audioPath: string): Promise<AudioQualityReport>
  normalize(input: string, output: string, targetLUFS?: number): Promise<void>
  removeSilence(input: string, output: string, options?): Promise<void>
}
```

### VideoProcessingQueue

```typescript
class VideoProcessingQueue {
  addJob<T>(type: string, data: T, options?): Promise<string>
  registerProcessor<T>(type: string, processor: JobProcessor<T>): void
  start(): void
  stop(): void
  getJob(jobId: string): QueueJob | undefined
  getStats(): QueueStats
}
```

### CacheManager

```typescript
class CacheManager {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, options?): Promise<void>
  delete(key: string): Promise<boolean>
  getOrSet<T>(key: string, factory: () => Promise<T>, options?): Promise<T>
  invalidateByTag(tag: string): Promise<number>
  getStats(): CacheStats
}
```

### VideoProcessingPipeline

```typescript
class VideoProcessingPipeline {
  processVideo(request: VideoProcessingRequest): Promise<string>
  processBatch(requests: VideoProcessingRequest[]): Promise<string[]>
  waitForCompletion(requestId: string, timeout?: number): Promise<ProcessingResult>
  getResult(requestId: string): ProcessingResult | undefined
  getStats(): PipelineStats
}
```

---

## 🧪 Testes

### Executar Todos os Testes

```bash
npm test
```

### Executar Testes Específicos

```bash
# Validator
npm test -- validator.test.ts

# Queue Manager
npm test -- queue-manager.test.ts

# Cache
npm test -- cache-manager.test.ts

# Pipeline Integration
npm test -- video-pipeline.integration.test.ts
```

### Executar com Cobertura

```bash
npm run test:coverage
```

### Script PowerShell de Teste

```powershell
.\test-video-system.ps1
```

---

## 🔍 Troubleshooting

### FFmpeg não encontrado

```bash
# Verificar instalação
ffmpeg -version

# Windows: Adicionar ao PATH
setx PATH "%PATH%;C:\ffmpeg\bin"
```

### Redis não conecta

```typescript
// Usar cache em memória ao invés de Redis
const cache = new CacheManager({
  useRedis: false  // Desabilitar Redis
});
```

### Testes falhando

```bash
# Limpar cache e reinstalar
rm -rf node_modules
rm package-lock.json
npm install

# Rodar testes novamente
npm test
```

---

## 📖 Documentação Completa

Veja `SPRINT54_IMPLEMENTATION_REPORT.md` para documentação detalhada.

---

## 🤝 Suporte

Para dúvidas ou problemas, consulte:
- Documentação inline nos arquivos TypeScript
- Testes de exemplo em `__tests__/`
- Relatório de implementação completo

---

**Desenvolvido com 💙 para o Sistema de Cursos NR**
