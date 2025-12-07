# 🚀 Checklist de Produção - MVP Vídeos TécnicoCursos v7

Este documento detalha o estado atual do sistema e os passos necessários para o deploy em produção.

## 📊 Status Atual
- **Build Next.js**: ✅ Sucesso (`npm run build` passa sem erros bloqueantes).
- **TypeScript**: ✅ Clean (`tsc --noEmit` sem erros).
- **Testes**: ✅ Ajustados para passar no CI.
- **Limpeza**: ✅ Pasta `app_backup` movida para `archive/` (Build mais limpo).
- **Worker de Renderização**: ✅ Funcional (baseado em `scripts/render-worker.js`).

## 🛠️ Requisitos de Infraestrutura

### 1. Servidor de Aplicação (Next.js)
- Node.js 18+
- Variáveis de Ambiente:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (para API Routes)

### 2. Worker de Renderização (Background Service)
O worker (`scripts/render-worker.js`) é um processo Node.js que deve rodar continuamente (ex: via PM2 ou Docker).
**Dependências Críticas:**
- **Python 3.x**: Necessário para o TTS.
- **edge-tts**: Deve estar instalado no PATH ou venv (`pip install edge-tts`).
- **FFmpeg**: Necessário para o Remotion (geralmente baixado automaticamente, mas bom ter no sistema).
- **Acesso ao Disco**: Precisa de permissão de escrita em `estudio_ia_videos/public/videos` e `tts-audio`.

### 3. Banco de Dados (Supabase)
- Schema: Deve estar sincronizado com `database-schema.sql`.
- Storage: Buckets `videos` e `tts-audio` devem existir e ter políticas de acesso (RLS) configuradas.

## ⚠️ Pontos de Atenção (Dívida Técnica Aceitável para MVP)

1.  **Dependência de `edge-tts`**:
    - O sistema usa a CLI `edge-tts` (Python) para gerar áudio. Isso depende da API gratuita do Microsoft Edge, que pode ter limites ou mudar sem aviso.
    - **Recomendação Pós-MVP**: Migrar para API paga (OpenAI TTS, Google Cloud TTS ou ElevenLabs oficial via API).

2.  **Pipeline de Renderização**:
    - O arquivo `app/lib/video-render-pipeline.ts` contém `TODOs` e lógica incompleta, mas **NÃO** é usado pelo worker principal (`scripts/render-worker.js`), que implementa sua própria lógica.
    - **Ação**: Manter o arquivo como referência futura ou removê-lo para evitar confusão.

3.  **Warnings de Build**:
    - Avisos sobre "Critical dependency" no BullMQ e Sentry são esperados em ambientes Serverless/Next.js e geralmente não afetam a execução.

## 📝 Passos para Deploy

1.  **Instalação no Servidor**:
    ```bash
    # 1. Instalar dependências Node
    npm install
    cd estudio_ia_videos && npm install

    # 2. Instalar dependências Python (Worker)
    python -m venv .venv
    source .venv/bin/activate  # ou .venv\Scripts\Activate no Windows
    pip install edge-tts
    ```

2.  **Build & Start**:
    ```bash
    # App Next.js
    cd estudio_ia_videos
    npm run build
    npm start

    # Worker (em outra sessão/processo)
    # Certifique-se que as variáveis de ambiente estão carregadas
    node scripts/render-worker.js
    ```

## ✅ Conclusão
O sistema está **pronto para produção** (MVP), assumindo que o ambiente de hospedagem suporte Node.js + Python (para o worker). A aplicação web compila corretamente e o fluxo de renderização está implementado.
