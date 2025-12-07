# 🚀 GUIA RÁPIDO - SISTEMA INTEGRADO

## Início Rápido em 5 Minutos

### 1. Inicializar o Sistema

```typescript
// pages/api/init.ts ou app/api/init/route.ts
import { initializeUnifiedSystem } from '@/lib/integration';

export async function GET() {
  const app = await initializeUnifiedSystem();
  const status = app.getStatus();
  
  return Response.json({
    success: true,
    status
  });
}
```

### 2. Usar no Componente React

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getUnifiedApplication } from '@/lib/integration';

export default function MyComponent() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const app = getUnifiedApplication();
    
    // Inicializar se necessário
    if (!app.isInitialized()) {
      app.initialize().then(() => {
        setStatus(app.getStatus());
      });
    } else {
      setStatus(app.getStatus());
    }
  }, []);

  return (
    <div>
      <h1>Sistema Status</h1>
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
}
```

### 3. Processar PPTX

```typescript
import { getUnifiedApplication } from '@/lib/integration';

const app = getUnifiedApplication();
const pptxAdapter = app.getAdapter('pptx');

// Processar arquivo
const result = await pptxAdapter.processFile(file, {
  enableTTS: true,
  validateQuality: true,
  preserveAnimations: true
});

console.log('Slides:', result.slides.length);
console.log('Qualidade:', result.qualityAnalysis.overallScore);
```

### 4. Renderizar Avatar

```typescript
import { getUnifiedApplication } from '@/lib/integration';

const app = getUnifiedApplication();
const avatarAdapter = app.getAdapter('avatar');

// Renderizar com avatar 3D
const video = await avatarAdapter.renderAvatar({
  engine: 'hyperreal',
  avatarId: 'avatar-001',
  text: 'Olá! Bem-vindo ao sistema.',
  settings: {
    quality: 'high',
    background: 'transparent'
  }
});

console.log('Vídeo gerado:', video.url);
```

### 5. Gerar TTS

```typescript
import { getUnifiedApplication } from '@/lib/integration';

const app = getUnifiedApplication();
const ttsAdapter = app.getAdapter('tts');

// Sintetizar voz
const audio = await ttsAdapter.synthesize({
  text: 'Este é um teste de síntese de voz',
  provider: 'azure',
  voiceId: 'pt-BR-FranciscaNeural',
  language: 'pt-BR'
});

// Upload para S3
const storageAdapter = app.getAdapter('storage');
const url = await storageAdapter.upload(audio, {
  key: `audio/${Date.now()}.mp3`,
  contentType: 'audio/mpeg'
});
```

### 6. Renderizar Vídeo

```typescript
import { getUnifiedApplication } from '@/lib/integration';

const app = getUnifiedApplication();
const renderAdapter = app.getAdapter('render');

// Adicionar à fila de renderização
const jobId = await renderAdapter.queueRender({
  projectId: 'project-123',
  timeline: {
    clips: [...],
    effects: [...],
    audio: [...]
  },
  settings: {
    quality: 'high',
    format: 'mp4',
    resolution: '1920x1080'
  }
});

// Verificar status
const status = await renderAdapter.getRenderStatus(jobId);
console.log('Progresso:', status.progress, '%');
```

### 7. Rastrear Analytics

```typescript
import { getUnifiedApplication } from '@/lib/integration';

const app = getUnifiedApplication();
const analyticsAdapter = app.getAdapter('analytics');

// Rastrear evento
await analyticsAdapter.track('video_created', {
  projectId: 'project-123',
  duration: 120,
  format: 'mp4',
  quality: 'high'
});

// Obter métricas
const metrics = await analyticsAdapter.getMetrics({
  startDate: '2025-10-01',
  endDate: '2025-10-08',
  events: ['video_created', 'pptx_processed']
});
```

## Comandos CLI

### Inicializar Sistema

```bash
# PowerShell
cd c:\xampp\htdocs\_MVP_Video_TecnicoCursos_v7\estudio_ia_videos\app
npx tsx scripts/initialize-unified-system.ts
```

### Verificar Status

```bash
# Node.js
node -e "
  const { getUnifiedApplication } = require('./lib/integration');
  const app = getUnifiedApplication();
  app.initialize().then(() => {
    console.log(app.getStatus());
  });
"
```

## Variáveis de Ambiente Mínimas

```env
# .env.local
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Azure TTS
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=brazilsouth
```

## Dicas Importantes

✅ **Sempre inicialize antes de usar** os adaptadores  
✅ **Use getUnifiedApplication()** para acesso singleton  
✅ **Monitore o health status** regularmente  
✅ **Configure variáveis de ambiente** antes de iniciar  
✅ **Implemente shutdown graceful** em produção  

## Troubleshooting

### Sistema não inicializa

```typescript
// Verifique configuração
import { validateConfiguration } from '@/lib/integration/unified-config';

const validation = validateConfiguration();
if (!validation.valid) {
  console.error('Erros:', validation.errors);
}
```

### Módulo com falha no health check

```typescript
const app = getUnifiedApplication();

app.on('moduleError', ({ moduleId, error }) => {
  console.error(`Módulo ${moduleId} falhou:`, error);
});

app.on('healthCheckCompleted', (results) => {
  const failed = Object.entries(results)
    .filter(([_, healthy]) => !healthy);
  
  if (failed.length > 0) {
    console.warn('Módulos não saudáveis:', failed);
  }
});
```

## Próximos Passos

1. ✅ Configurar variáveis de ambiente
2. ✅ Inicializar o sistema
3. ✅ Testar adaptadores principais
4. ✅ Implementar em suas páginas/APIs
5. ✅ Deploy em staging
6. ✅ Deploy em produção

---

**Documentação Completa:** [SYSTEM_INTEGRATION_CONSOLIDATION_REPORT.md](./SYSTEM_INTEGRATION_CONSOLIDATION_REPORT.md)
