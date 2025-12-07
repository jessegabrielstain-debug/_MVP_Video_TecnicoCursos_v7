# Implementação da Exportação de Vídeo (Remotion)

## Visão Geral
Implementamos o pipeline completo de renderização de vídeo utilizando **Remotion**. O sistema agora é capaz de converter os slides (com imagens e áudio) em um arquivo MP4 final.

## Componentes Criados

### 1. Backend (Renderização)
- **`app/lib/services/render-service.ts`**: Serviço central que orquestra o processo.
  - **Bundle**: Empacota o código React do vídeo.
  - **Render**: Executa o render frame-a-frame usando Chromium headless.
  - **Upload**: Envia o MP4 resultante para o S3.
- **`app/api/v1/export/route.ts`**: Endpoint API protegido que recebe o `projectId`, busca os dados no banco e aciona o `RenderService`.

### 2. Engine de Vídeo (Remotion)
- **`app/remotion/Root.tsx`**: Configuração da composição (1920x1080, 30fps).
- **`app/remotion/Composition.tsx`**: Componente React que define o visual do vídeo.
  - Renderiza slides sequencialmente.
  - Sincroniza áudio (`<Audio />`) com a duração do slide.
  - Exibe imagens de fundo ou texto.
- **`app/remotion/index.ts`**: Ponto de entrada para o bundler.

### 3. Frontend
- **`app/components/pptx/professional-pptx-studio.tsx`**:
  - Aba "Exportar" atualizada.
  - Botão "Renderizar Vídeo Final (MP4)" conectado à API.
  - Feedback visual de status (Loading/Sucesso).

## Fluxo de Dados
1. Usuário clica em "Exportar" no Studio.
2. Frontend chama `POST /api/v1/export`.
3. API valida sessão e busca projeto no Prisma/Supabase.
4. Dados dos slides são normalizados e passados para o `RenderService`.
5. Remotion gera o vídeo em `public/renders/`.
6. Vídeo é enviado para o bucket S3.
7. URL do vídeo é salva no projeto e retornada ao frontend.

## Próximos Passos
- **Monitoramento**: Implementar polling para acompanhar o progresso do render (atualmente a requisição espera o fim do processo, o que pode causar timeout em vídeos longos).
- **Fila**: Mover o processamento para uma fila (BullMQ) para evitar timeouts HTTP.
- **Preview**: Adicionar player do Remotion no frontend para preview em tempo real antes do render final.

## Requisitos de Ambiente
Certifique-se de que as seguintes variáveis estão no `.env.local`:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
