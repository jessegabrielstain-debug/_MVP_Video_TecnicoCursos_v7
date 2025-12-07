# 🚀 Export System - Quick Start

## ⚡ Início Rápido (5 minutos)

### 1. Instalar FFmpeg

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
1. Baixar: https://ffmpeg.org/download.html
2. Extrair para `C:\ffmpeg`
3. Adicionar ao PATH: `C:\ffmpeg\bin`

**Verificar:**
```bash
ffmpeg -version
```

---

### 2. Configurar Variáveis de Ambiente

Criar/editar `.env.local`:

```env
# Storage Provider (supabase ou local)
STORAGE_PROVIDER=local

# Supabase (opcional, se usar supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

---

### 3. Iniciar Export Worker

Editar `server.ts` (ou arquivo de inicialização):

```typescript
import { startExportWorker } from '@/lib/export/export-worker'

// Após iniciar servidor HTTP
startExportWorker()
console.log('Export worker started')
```

---

### 4. Usar no Frontend

```typescript
import { VideoExportDialog } from '@/components/export/VideoExportDialog'

function MyPage() {
  const [showExport, setShowExport] = useState(false)

  return (
    <>
      <button onClick={() => setShowExport(true)}>
        Exportar Vídeo
      </button>

      {showExport && (
        <VideoExportDialog
          userId="user-123"
          projectId="project-456"
          timelineId="timeline-789"
          timelineData={timeline}
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  )
}
```

---

### 5. Testar Exportação

1. **Abrir UI de exportação**
2. **Selecionar configurações:**
   - Formato: MP4
   - Resolução: 1080p
   - Qualidade: High
   - FPS: 30
3. **Clicar "Iniciar Exportação"**
4. **Acompanhar progresso em tempo real**
5. **Baixar vídeo quando concluir**

---

## 🎨 Exemplo Completo

```typescript
'use client'

import { useState } from 'react'
import { VideoExportDialog } from '@/components/export/VideoExportDialog'
import { useExportSocket } from '@/hooks/useExportSocket'

export default function ExportPage() {
  const [showDialog, setShowDialog] = useState(false)
  const [jobHistory, setJobHistory] = useState([])

  const { currentProgress, isConnected } = useExportSocket('user-123', {
    onProgress: (progress) => {
      console.log(`Export ${progress.jobId}: ${progress.progress}%`)
    },
    onComplete: (data) => {
      setJobHistory(prev => [...prev, data])
      alert('Export completo! URL: ' + data.outputUrl)
    },
    onFailed: (data) => {
      alert('Export falhou: ' + data.error)
    }
  })

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Exportação de Vídeos</h1>

      {/* Connection Status */}
      <div className="mb-4 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
      </div>

      {/* Export Button */}
      <button
        onClick={() => setShowDialog(true)}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Nova Exportação
      </button>

      {/* Current Progress */}
      {currentProgress && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Exportação em Andamento</h3>
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm">{currentProgress.currentPhase}</span>
              <span className="text-sm">{currentProgress.progress}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${currentProgress.progress}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600">{currentProgress.message}</p>
        </div>
      )}

      {/* Job History */}
      <div className="mt-8">
        <h3 className="font-semibold mb-4">Histórico de Exportações</h3>
        <div className="space-y-2">
          {jobHistory.map((job, i) => (
            <div key={i} className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Job {job.jobId}</span>
                <a
                  href={job.outputUrl}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  Download
                </a>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Tamanho: {(job.fileSize / 1024 / 1024).toFixed(2)} MB | 
                Duração: {job.duration.toFixed(1)}s
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Dialog */}
      {showDialog && (
        <VideoExportDialog
          userId="user-123"
          projectId="project-456"
          timelineId="timeline-789"
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  )
}
```

---

## 🔧 Configurações Recomendadas

### Para Preview Rápido:

```typescript
{
  format: ExportFormat.MP4,
  resolution: ExportResolution.HD_720,
  quality: ExportQuality.LOW,  // CRF 28, ultrafast
  fps: 24
}
```

**Tempo estimado:** 15-20s para 60s de vídeo

---

### Para Produção:

```typescript
{
  format: ExportFormat.MP4,
  resolution: ExportResolution.FULL_HD_1080,
  quality: ExportQuality.HIGH,  // CRF 18, medium
  fps: 30
}
```

**Tempo estimado:** 60-90s para 60s de vídeo

---

### Para Máxima Qualidade:

```typescript
{
  format: ExportFormat.MP4,
  resolution: ExportResolution.UHD_4K,
  quality: ExportQuality.ULTRA,  // CRF 15, slow
  fps: 60
}
```

**Tempo estimado:** 3-5 minutos para 60s de vídeo

---

## 🌐 API REST (Opcional)

### Criar Export via API

```bash
curl -X POST http://localhost:3000/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "projectId": "project-456",
    "timelineId": "timeline-789",
    "settings": {
      "format": "mp4",
      "resolution": "1080p",
      "quality": "high",
      "fps": 30
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "jobId": "export-job-abc123",
  "status": "pending"
}
```

---

### Verificar Status

```bash
curl http://localhost:3000/api/v1/export/export-job-abc123
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "export-job-abc123",
    "status": "processing",
    "progress": 45,
    "outputUrl": null,
    "estimatedTimeRemaining": 30
  }
}
```

---

### Cancelar Export

```bash
curl -X DELETE http://localhost:3000/api/v1/export/export-job-abc123
```

---

### Ver Fila

```bash
curl http://localhost:3000/api/v1/export/queue/status
```

**Response:**
```json
{
  "success": true,
  "queue": {
    "totalJobs": 5,
    "pendingJobs": 2,
    "processingJobs": 1,
    "completedJobs": 2
  },
  "statistics": {
    "averageDuration": 75
  }
}
```

---

## 🐛 Troubleshooting Rápido

### Erro: FFmpeg não encontrado

```bash
# Verificar PATH
which ffmpeg  # Linux/Mac
where ffmpeg  # Windows

# Se não encontrado, instalar novamente
```

---

### Erro: WebSocket não conecta

```typescript
// Verificar configuração do servidor
import { initializeWebSocket } from '@/lib/websocket/timeline-websocket'

const httpServer = createServer()
initializeWebSocket(httpServer)
```

---

### Erro: Renderização muito lenta

```typescript
// Usar preset mais rápido
{
  quality: ExportQuality.LOW,  // ultrafast preset
  resolution: ExportResolution.HD_720  // menor resolução
}
```

---

### Erro: Memória insuficiente

```bash
# Aumentar heap do Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

---

## 📚 Documentação Completa

Para detalhes completos, consultar:

- **`EXPORT_RENDERING_DOCUMENTATION.md`** - Documentação técnica completa
- **`SPRINT47_EXPORT_RENDERING_COMPLETE.md`** - Relatório de implementação

---

## ✅ Checklist de Verificação

- [ ] FFmpeg instalado e no PATH
- [ ] Variáveis de ambiente configuradas
- [ ] Export worker iniciado no servidor
- [ ] WebSocket funcionando
- [ ] Diretório `/public/exports` criado (se usar local storage)
- [ ] Testado exportação end-to-end

---

## 🎉 Pronto para Usar!

Agora você pode:

✅ Exportar vídeos em MP4, WebM ou MOV  
✅ Escolher resolução (720p, 1080p, 4K)  
✅ Configurar qualidade (Low, Medium, High, Ultra)  
✅ Acompanhar progresso em tempo real  
✅ Baixar vídeos exportados  

**Boa exportação! 🎬**
