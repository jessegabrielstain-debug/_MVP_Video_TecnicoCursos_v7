# Conclusão: Diálogo de Exportação e Modo Preview

## ✅ Implementações Realizadas

1.  **Componente `ExportDialog`**
    *   Criado em `app/components/editor/export-dialog.tsx`.
    *   Permite selecionar entre **Modo Rascunho (Preview)** e **Modo Produção**.
    *   Exibe alertas sobre consumo de créditos no modo Produção.
    *   Permite configurar formato (MP4/WebM) e resolução (720p/1080p).

2.  **Integração no Editor (`TimelineEditorReal`)**
    *   Adicionado botão "Exportar" na barra de ferramentas.
    *   Integrado o diálogo de exportação ao fluxo do editor.
    *   Implementada a chamada à API `/api/render/start` com os parâmetros selecionados.

3.  **Atualização da API e Pipeline**
    *   Rota `/api/render/start` atualizada para aceitar e repassar a flag `test`.
    *   Tipagem `RenderConfig` e `RenderTaskPayload` atualizada para incluir `test?: boolean`.
    *   O pipeline já estava preparado para usar `test: true` no HeyGen (gerando vídeos com marca d'água e sem custo).

## 🚀 Como Testar

1.  Abra o Editor (`/editor`).
2.  Adicione um slide com Avatar HeyGen.
3.  Clique em **Exportar**.
4.  Selecione **Rascunho (Preview)**.
5.  Clique em **Exportar Vídeo**.
6.  Verifique se o toast de sucesso aparece e se o job é criado.
7.  O vídeo resultante deverá ter a marca d'água da HeyGen e não descontar créditos.

## ⚠️ Próximos Passos (Recomendados)

*   **Widget de Créditos:** Implementar visualização do saldo de créditos na UI.
*   **Histórico de Exportações:** Listar os vídeos gerados anteriormente para download rápido.
