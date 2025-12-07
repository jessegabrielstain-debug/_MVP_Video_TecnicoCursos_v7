# 🚀 Batch Video Processor - Guia Rápido

## ⚡ Início Rápido (30 segundos)

### 1. Criar Processador

```typescript
import { createBasicBatchProcessor } from '@/lib/video/batch-processor';

const processor = createBasicBatchProcessor();
```

### 2. Registrar Handler

```typescript
processor.registerHandler('transcode', async (task, updateProgress) => {
  // Seu código de processamento aqui
  updateProgress(50);
  
  // Retornar resultado
  return {
    taskId: task.id,
    success: true,
    processingTime: 1000,
    retryCount: 0,
    outputPath: task.outputPath,
  };
});
```

### 3. Adicionar Tasks

```typescript
processor.addTask('transcode', './input.mp4', './output.mp4');
```

### 4. Monitorar Progresso

```typescript
processor.on('statistics:updated', (stats) => {
  console.log(`Progresso: ${stats.completed}/${stats.total}`);
});
```

---

## 📖 Exemplos Práticos

### Exemplo 1: Processar 10 Vídeos

```typescript
const processor = createBasicBatchProcessor();

// Registrar handler
processor.registerHandler('transcode', async (task) => {
  // Processar vídeo...
  return { taskId: task.id, success: true, processingTime: 5000 };
});

// Adicionar 10 vídeos
for (let i = 1; i <= 10; i++) {
  processor.addTask(
    'transcode',
    `./videos/video${i}.mp4`,
    `./output/video${i}_transcoded.mp4`
  );
}

// O processamento inicia automaticamente!
```

### Exemplo 2: Com Prioridade

```typescript
// Urgente - processa primeiro
processor.addTask('transcode', './important.mp4', './out1.mp4', {
  priority: 'urgent',
});

// Normal
processor.addTask('transcode', './normal.mp4', './out2.mp4');

// Baixa prioridade - processa por último
processor.addTask('transcode', './optional.mp4', './out3.mp4', {
  priority: 'low',
});
```

### Exemplo 3: Monitoramento Completo

```typescript
const processor = createBasicBatchProcessor();

// Task iniciada
processor.on('task:started', (task) => {
  console.log(`▶️  Processando ${task.id}...`);
});

// Task completada
processor.on('task:completed', (task) => {
  console.log(`✅ ${task.id} concluída em ${task.result.processingTime}ms`);
});

// Task falhou
processor.on('task:failed', ({ task, error }) => {
  console.error(`❌ ${task.id} falhou: ${error}`);
});

// Estatísticas atualizadas
processor.on('statistics:updated', (stats) => {
  const progress = (stats.completed / stats.total) * 100;
  console.log(`📊 Progresso: ${progress.toFixed(1)}%`);
});
```

### Exemplo 4: Controle Manual

```typescript
const processor = createServerProcessor(); // autoStart: false

// Adicionar tasks
processor.addTask('transcode', './v1.mp4', './o1.mp4');
processor.addTask('transcode', './v2.mp4', './o2.mp4');

// Iniciar quando quiser
processor.start();

// Pausar
processor.pause();

// Continuar
processor.start();

// Parar e aguardar conclusão
await processor.stop();
```

### Exemplo 5: Persistência de Estado

```typescript
const processor = createHighPerformanceProcessor();

// Adicionar tasks
processor.addTask('transcode', './v1.mp4', './o1.mp4');

// Salvar estado
await processor.saveState();
// Arquivo: ./batch-state.json

// Restaurar estado (após restart)
await processor.loadState();
```

---

## 🎨 Configurações Avançadas

### Custom Configuration

```typescript
import { BatchProcessor } from '@/lib/video/batch-processor';

const processor = new BatchProcessor({
  maxConcurrent: 5,          // 5 tasks simultâneas
  retryStrategy: 'exponential', // Retry com backoff
  maxRetries: 3,             // Máximo de 3 tentativas
  timeout: 300000,           // Timeout de 5 minutos
  priorityEnabled: true,     // Habilitar prioridade
  autoStart: true,           // Iniciar automaticamente
  stateFilePath: './my-state.json', // Caminho do estado
  retryDelay: 1000,          // Delay base de 1s
});
```

### Retry Strategies

```typescript
// Exponential: 1s → 2s → 4s → 8s
retryStrategy: 'exponential'

// Linear: 1s → 2s → 3s → 4s
retryStrategy: 'linear'

// Fixed: 1s → 1s → 1s → 1s
retryStrategy: 'fixed'

// Sem retry
retryStrategy: 'none'
```

---

## 📊 Consultas e Estatísticas

### Obter Estatísticas

```typescript
const stats = processor.getStatistics();

console.log(`
  Total: ${stats.total}
  Completadas: ${stats.completed}
  Falhadas: ${stats.failed}
  Em Processamento: ${stats.processing}
  Na Fila: ${stats.queued}
  
  Taxa de Sucesso: ${stats.successRate}%
  Tempo Médio: ${stats.averageProcessingTime}ms
  ETA: ${stats.estimatedTimeRemaining}ms
`);
```

### Obter Progresso Geral

```typescript
const progress = processor.getOverallProgress();
console.log(`Progresso: ${progress}%`); // 0-100
```

### Consultar Tasks

```typescript
// Todas as tasks
const all = processor.getAllTasks();

// Tasks por status
const completed = processor.getTasksByStatus('completed');
const failed = processor.getTasksByStatus('failed');
const processing = processor.getTasksByStatus('processing');

// Task específica
const task = processor.getTask('task-1');
```

---

## 🎯 Factory Presets

### Basic (Geral)

```typescript
const processor = createBasicBatchProcessor();
// maxConcurrent: 3, FIFO, auto-start
```

### High Performance (Produção)

```typescript
const processor = createHighPerformanceProcessor();
// maxConcurrent: 10, priority, persistência
```

### Server (Manual)

```typescript
const processor = createServerProcessor();
// maxConcurrent: 5, manual start, persistência
```

### Development (Debug)

```typescript
const processor = createDevelopmentProcessor();
// maxConcurrent: 1, sem persistência
```

---

## ⚙️ Gerenciamento de Tasks

### Adicionar Task

```typescript
const taskId = processor.addTask(
  'transcode',
  './input.mp4',
  './output.mp4',
  {
    priority: 'urgent',
    metadata: { user: 'john', project: 'demo' },
  }
);
```

### Adicionar Múltiplas

```typescript
const ids = processor.addTasks([
  { operation: 'transcode', inputPath: './v1.mp4', outputPath: './o1.mp4' },
  { operation: 'compress', inputPath: './v2.mp4', outputPath: './o2.mp4' },
  { operation: 'watermark', inputPath: './v3.mp4', outputPath: './o3.mp4' },
]);
```

### Cancelar Task

```typescript
const cancelled = processor.cancelTask('task-1');
if (cancelled) {
  console.log('Task cancelada');
}
```

### Remover Task

```typescript
const removed = processor.removeTask('task-1');
```

### Limpar Tasks Completadas

```typescript
const count = processor.clearCompletedTasks();
console.log(`${count} tasks removidas`);
```

---

## 🔧 Handlers Customizados

### Registrar Handler

```typescript
processor.registerHandler('custom', async (task, updateProgress) => {
  const start = Date.now();
  
  try {
    // Processamento...
    updateProgress(25);
    
    // Mais processamento...
    updateProgress(50);
    
    // Finalizar...
    updateProgress(100);
    
    return {
      taskId: task.id,
      success: true,
      processingTime: Date.now() - start,
      retryCount: task.retryCount,
      outputPath: task.outputPath,
    };
  } catch (error) {
    throw error; // Será tratado automaticamente
  }
});
```

### Verificar Handler

```typescript
if (processor.hasHandler('custom')) {
  console.log('Handler disponível');
}
```

### Remover Handler

```typescript
const removed = processor.unregisterHandler('custom');
```

---

## 🎪 Eventos Disponíveis

### Task Events

```typescript
processor.on('task:added', (task) => { });
processor.on('task:queued', (task) => { });
processor.on('task:started', (task) => { });
processor.on('task:completed', (task) => { });
processor.on('task:failed', ({ task, error }) => { });
processor.on('task:cancelled', (task) => { });
processor.on('task:removed', (task) => { });
processor.on('task:retrying', ({ task, delay, maxRetries }) => { });
```

### Batch Events

```typescript
processor.on('tasks:batch-added', (tasks) => { });
processor.on('tasks:cleared', (count) => { });
```

### Handler Events

```typescript
processor.on('handler:registered', ({ operation }) => { });
processor.on('handler:unregistered', ({ operation }) => { });
```

### Processor Events

```typescript
processor.on('processor:started', () => { });
processor.on('processor:paused', () => { });
processor.on('processor:stopped', () => { });
processor.on('processor:reset', () => { });
```

### Statistics Events

```typescript
processor.on('statistics:updated', (stats) => { });
```

### State Events

```typescript
processor.on('state:saved', ({ path }) => { });
processor.on('state:loaded', ({ path }) => { });
processor.on('state:load-error', ({ error }) => { });
```

### Config Events

```typescript
processor.on('config:updated', (config) => { });
```

---

## 💡 Dicas e Boas Práticas

### 1. Use Factory Presets

```typescript
// ❌ Não configure manualmente
const processor = new BatchProcessor({ ... });

// ✅ Use presets prontos
const processor = createBasicBatchProcessor();
```

### 2. Sempre Registre Handlers

```typescript
// ❌ Adicionar task sem handler
processor.addTask('custom', './in.mp4', './out.mp4');

// ✅ Registrar handler primeiro
processor.registerHandler('custom', async (task) => { ... });
processor.addTask('custom', './in.mp4', './out.mp4');
```

### 3. Monitore Eventos

```typescript
// ❌ Não monitorar
processor.addTask(...);

// ✅ Sempre monitorar
processor.on('task:failed', ({ task, error }) => {
  console.error(`Task falhou: ${error}`);
});
```

### 4. Use Prioridades Sabiamente

```typescript
// ✅ Priorize tarefas importantes
processor.addTask('transcode', './critical.mp4', './out.mp4', {
  priority: 'urgent',
});

processor.addTask('thumbnail', './optional.mp4', './thumb.jpg', {
  priority: 'low',
});
```

### 5. Salve Estado em Produção

```typescript
// ✅ Salvar estado periodicamente
setInterval(async () => {
  await processor.saveState();
}, 60000); // A cada 1 minuto

// ✅ Restaurar ao iniciar
await processor.loadState();
```

---

## ❓ Troubleshooting

### Task não processa

```typescript
// Verificar se há handler
if (!processor.hasHandler('transcode')) {
  console.error('Handler não registrado!');
  processor.registerHandler('transcode', ...);
}

// Verificar se está rodando
if (!processor.isProcessing()) {
  console.log('Processador pausado');
  processor.start();
}
```

### Muitas tasks falhando

```typescript
// Aumentar retries
processor.updateConfig({
  maxRetries: 5,
  retryStrategy: 'exponential',
});

// Aumentar timeout
processor.updateConfig({
  timeout: 600000, // 10 minutos
});
```

### Performance baixa

```typescript
// Aumentar concorrência
processor.updateConfig({
  maxConcurrent: 10,
});

// Usar preset de alta performance
const processor = createHighPerformanceProcessor();
```

---

## 📚 Referências

- **Documentação Completa**: `SPRINT59_BATCH_PROCESSOR_COMPLETE.md`
- **Código Fonte**: `app/lib/video/batch-processor.ts`
- **Testes**: `app/__tests__/lib/video/batch-processor.test.ts`

---

**Criado por**: GitHub Copilot  
**Versão**: 1.0.0  
**Data**: Janeiro 2025
