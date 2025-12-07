# Guia de Integração HeyGen - Sistema de Avatares Hiper-Realistas

Este documento detalha a implementação da integração com a API da HeyGen para geração de vídeos com avatares hiper-realistas.

## 1. Visão Geral

O sistema permite que usuários selecionem avatares da HeyGen no editor de slides. Ao renderizar o vídeo, o pipeline detecta esses slides, envia uma requisição para a API da HeyGen, aguarda a geração do vídeo e o integra ao vídeo final.

## 2. Componentes Implementados

### 2.1. Frontend (`AvatarGallery`)
- **Localização**: `app/components/avatars/avatar-gallery.tsx`
- **Funcionalidade**:
  - Nova aba/filtro para avatares "HeyGen".
  - Badge "PRO" para diferenciar avatares premium.
  - Seleção atualiza o estado do slide com `engine: 'heygen'` e `avatarId`.

### 2.2. Backend Service (`HeyGenService`)
- **Localização**: `app/lib/heygen-service.ts`
- **Funcionalidade**:
  - Wrapper para a API v2 da HeyGen.
  - Métodos: `checkHealth`, `generateVideo`, `checkStatus`.
  - Gerencia autenticação via `HEYGEN_API_KEY`.

### 2.3. Engine Adapter (`HeyGenAvatarEngine`)
- **Localização**: `app/lib/engines/heygen-avatar-engine.ts`
- **Funcionalidade**:
  - Implementa a interface padrão de engine de avatar.
  - Adapta chamadas do orquestrador para o serviço HeyGen.

### 2.4. Pipeline de Renderização (`VideoRenderPipeline`)
- **Localização**: `app/lib/video-render-pipeline.ts`
- **Fluxo Atualizado**:
  1. Itera sobre os slides.
  2. Verifica `slide.avatar_config.engine`.
  3. Se `heygen`:
     - Chama `avatarEngine.render({ engine: 'heygen', ... })`.
     - Recebe `jobId`.
     - Faz polling do status até `completed`.
     - Baixa o vídeo gerado (MP4) para o diretório temporário.
  4. Se `ue5` ou `local`: Segue fluxo anterior (TTS + Imagem/Sequência).
  5. Concatena todos os vídeos.

### 2.5. API Route (`/api/render/start`)
- **Localização**: `app/api/render/start/route.ts`
- **Atualização**:
  - Mapeia corretamente `avatar_config` dos slides para o payload do job.
  - Garante que a configuração do avatar chegue ao worker/pipeline.

## 3. Configuração Necessária

Para que a integração funcione, é necessário configurar a chave de API no arquivo `.env.local`:

```env
HEYGEN_API_KEY=sua_chave_api_aqui
```

## 4. Como Testar

### 4.1. Teste de Integração (Script)
Execute o script de teste isolado para verificar a conexão com a API:

```bash
npx tsx scripts/test-heygen-integration.ts
```

### 4.2. Teste End-to-End (Fluxo Completo)
1. Inicie o servidor: `npm run dev`
2. Abra o editor de vídeo.
3. Selecione um slide.
4. Na galeria de avatares, escolha um avatar HeyGen (ex: "Anna").
5. Adicione texto ao slide.
6. Clique em "Exportar" ou "Renderizar".
7. Acompanhe os logs do terminal para ver o progresso do pipeline (`[Pipeline] Slide X uses HeyGen avatar...`).

## 5. Limitações Atuais & Próximos Passos

- **Custo/Tempo**: A geração via HeyGen é assíncrona e pode levar minutos. O pipeline atual espera ativamente (polling). Para produção, considerar webhooks.
- **Erro**: Se a API falhar ou demorar muito (> 5 min), o job falha.
- **Cache**: Não há cache de vídeos gerados. O mesmo texto/avatar gerará uma nova cobrança na API. Implementar hash de conteúdo para cache é recomendado.
