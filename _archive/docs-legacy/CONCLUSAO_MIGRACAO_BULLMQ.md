# Migração para BullMQ (Fila de Renderização)

## ✅ Implementado

### 1. Novo Worker Baseado em BullMQ
- **Arquivo**: `scripts/render-worker-bull.ts`
- **Tecnologia**: BullMQ + Redis + TypeScript.
- **Funcionalidade**:
  - Consome jobs da fila `render-jobs`.
  - Atualiza status no Supabase (Processing -> Completed/Failed).
  - Gera áudio (Edge-TTS).
  - Renderiza vídeo (Remotion).
  - Upload para Supabase Storage.
  - Dispara Webhooks.
- **Vantagens**:
  - Escalabilidade horizontal (pode rodar múltiplos workers).
  - Retries automáticos e backoff exponencial configuráveis.
  - Melhor observabilidade (Dashboard BullMQ possível).
  - Não sobrecarrega o banco de dados com polling.

### 2. Integração com API Existente
- A rota `POST /api/render/start` já estava configurada para enviar jobs para a fila (`addVideoJob`).
- O sistema agora suporta **Híbrido**:
  - O job é salvo no Banco (para histórico e status via API).
  - O job é enviado para o Redis (para processamento assíncrono rápido).

## 🚀 Como Usar

### Opção A: Modo Produção (Recomendado)
Requer Redis rodando.

1. **Iniciar Redis**:
   ```powershell
   npm run redis:start
   ```

2. **Iniciar Worker BullMQ**:
   ```powershell
   # Requer tsx instalado globalmente ou via npx
   npx tsx scripts/render-worker-bull.ts
   ```

### Opção B: Modo Legado (Sem Docker/Redis)
Usa Polling no banco de dados.

1. **Iniciar Worker Polling**:
   ```powershell
   node scripts/render-worker.js
   ```

## ⚠️ Notas Importantes
- Certifique-se de que as variáveis `REDIS_URL`, `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão no `.env`.
- O worker BullMQ usa o mesmo logger estruturado (`scripts/logger.js`) para consistência.
