# Guia de Teste Manual: Exportação de Vídeo

Este documento descreve como validar a funcionalidade de exportação de vídeo "Force Mode" implementada.

## Pré-requisitos
1.  Aplicação rodando (`npm run dev`).
2.  Credenciais AWS configuradas no `.env.local` (Já realizado).
3.  Bucket S3 `estudio-ia-videos-render` criado (Já realizado).

## Passo a Passo

### 1. Criar/Carregar Projeto
1.  Acesse `http://localhost:3000/studio`.
2.  Faça upload de um arquivo PPTX simples (ou use um existente).
3.  Aguarde o processamento dos slides.

### 2. Gerar Áudio (TTS)
1.  Vá para a aba **TTS/Áudio**.
2.  Clique em "Gerar Narração para Todos os Slides".
3.  Aguarde a conclusão (ícones de áudio aparecerão nos slides).

### 3. Exportar Vídeo
1.  Vá para a aba **Exportar**.
2.  Clique no botão **"Renderizar Vídeo Final (MP4)"**.
3.  O status mudará para "Renderizando...".
4.  Aguarde (o tempo depende da duração do vídeo, aprox. 1-2x o tempo real).

### 4. Validação
1.  Quando concluído, o player de vídeo aparecerá na tela.
2.  Dê Play e verifique:
    *   Se o áudio está sincronizado.
    *   Se as animações de entrada (título/texto) funcionam.
    *   Se a barra de progresso azul aparece no rodapé.
3.  Clique em "Baixar MP4" e verifique se o arquivo é salvo corretamente.
4.  Clique em "Abrir em Nova Aba" para verificar se o link do S3 está público/acessível.

## Solução de Problemas

- **Erro "Unauthorized"**: Verifique se você está logado. Tente recarregar a página.
- **Erro no Render**: Verifique o terminal onde o `npm run dev` está rodando para ver logs detalhados do `RenderService`.
- **Vídeo sem áudio**: Verifique se os slides tinham áudio gerado antes da exportação.

---
**Status do Sistema:** PRONTO PARA TESTE 🚀
