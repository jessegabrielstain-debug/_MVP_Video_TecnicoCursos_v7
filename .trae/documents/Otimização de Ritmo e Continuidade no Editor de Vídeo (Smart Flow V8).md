## Objetivo
- Implementar recursos avançados de ritmo e continuidade visual no editor para acelerar a edição, elevar a qualidade e reduzir a curva de aprendizado.
- Entregar funcionalidades de detecção de batidas, transições inteligentes, correção de cor, velocidade variável com curvas e UI premium com visualização em tempo real.

## Escopo de Funcionalidades
- Ajuste automático de ritmo: detecção de batidas, pontos de corte naturais, suavização inteligente de transições, velocidade variável (slow motion 0.25x–0.75x, time‑lapse 2x–10x) com curvas personalizáveis.
- Continuidade visual: correção de cor automática (WB, exposição, tons de pele, histograma), transições context‑aware (movimento/fluxo óptico), alinhamento espacial (perspectiva/objetos/horizonte).
- UI premium: timeline com intensidade de ritmo, overlay de batidas, marcadores de corte sugeridos, controles profissionais de sincronização e fine‑tuning, preview acelerado por GPU, modo antes/depois, baixa latência.
- Requisitos técnicos: compatibilidade com MP4/MOV/AVI/MKV; H.264/H.265/ProRes/DNxHD; até 8K; desempenho com 100+ faixas; histórico 100+ ações; auto‑save e recuperação.
- Testes: estilos diversos (entrevista, videoclipe, doc, vlog), projetos complexos (5+ vídeo, 8+ áudio, efeitos aninhados), exportação em todos formatos suportados com bitrate variável, metadados, legendas, capas.

## Arquitetura Técnica
- Frontend (Next.js):
  - Web Audio + WebWorker para análise de espectro (BPM e onsets) com fallback em servidor.
  - Canvas/WebGL para preview realtime (LUTs, correções, transições) e comparação antes/depois.
  - Timeline virtualizada com waveform multifaixa, overlays (batidas/cortes), marcadores magnéticos.
  - Modelos de visão (MediaPipe/Human/face‑api.js) para detecção de rosto/objeto e auto‑reframing; fallback heurístico sem IA.
- Backend/Worker (FFmpeg + BullMQ):
  - Pipelines com filtros: `acrossfade`, `afade`, `silencedetect`, `ebur128/astats` (análise), `eq/colorbalance/lut3d` (cor), `minterpolate` (slow motion), `setpts` (time‑lapse), `vidstabdetect/vidstabtransform` (estabilização), `subtitles`/`mov_text` (legendas), `attach` (capa).
  - Perfis de exportação: MP4/H.264, H.265, ProRes, DNxHD; presets de bitrate variável; metadados personalizados.
  - Serviços de fila e progresso via SSE/WebSocket; logs estruturados; retries idempotentes.
- Persistência/Histórico:
  - Estado imutável (Immer/Zustand) com snapshots incrementais (100+ ações) e auto‑save versionado.
  - Recuperação de sessão (storage local + servidor) e checkpoints em operações longas.

## Implementação por Módulo
- Ritmo (Auto‑Pacing):
  - Detector de batidas (spectral flux + peak picking). Geração de marcadores magnéticos e sugestão de cortes.
  - Suavização de transições: J/L‑cuts automáticos com regras de conteúdo (voz/música/ambiente) e `acrossfade`/`afade`.
  - Velocidade variável: curvas Bézier para aceleração/desaceleração; `minterpolate` para slow motion suave; `setpts` para time‑lapse.
- Continuidade Visual:
  - Color Match: análise de histograma (YUV/RGB) e tons de pele; aplicação via `eq/colorbalance/lut3d`; opção de LUT por projeto.
  - Transições inteligentes: escolha baseada em movimento/fluxo (diferenciação de quadros, estimativa de movimento) e contexto de cena.
  - Alinhamento espacial: auto‑reframing com detecção de sujeito e linhas de horizonte; heurística de perspectiva quando IA indisponível.
- UI/UX:
  - Timeline: waveform por faixa, heatmap de intensidade, overlay de batidas/cortes, snapping configurável.
  - Controles: painel “Smart Flow” (sincronização AV, intensidade de transição, balanceamento de continuidade, curvas de velocidade).
  - Preview: GPU com baixa latência, modo A/B (antes/depois), indicadores de carga e qualidade.
- Compatibilidade/Export:
  - Perfis e validações para MP4/MOV/AVI/MKV; H.264/H.265/ProRes/DNxHD; até 8K.
  - Legendas embutidas (SRT/WEBVTT -> mov_text); metadados (title/artist/description); capas (attach JPEG/PNG).

## Performance e Robustez
- Virtualização de UI para 100+ faixas; workers dedicados para análise; throttling/priority para operações pesadas.
- Cache de resultados (batidas, histogramas, fluxo) por clipe; memórias intermediárias no worker.
- Undo/Redo com compressão de diffs; auto‑save a cada N ações/segundos; recuperação pós‑falha.

## Testes
- Unitários: detectores (batidas, tons de pele, histograma), gerador de curvas, heurísticas de transição.
- Integração: pipelines FFmpeg por perfil; sincronização AV; color match entre clipes; reframing em diferentes formatos.
- E2E (Playwright): timeline pesada (100+ faixas), preview realtime, edição com marcadores, export múltipla (todos formatos); verificação de artefatos e sync.
- Performance: benchmarks de análise e preview; auditoria de drop frames e latência; stress com projetos >4h.

## Entregáveis
- Código dos módulos (frontend/worker) e UI “Smart Flow”.
- Perfis de exportação atualizados e documentação de uso.
- Suite de testes e relatórios de resultados.
- Atualização do documento `jesus_editor_video` com a seção “Smart Flow Premium”.

## Riscos e Mitigações
- Carga computacional (slow motion/optical flow): usar presets e permitir modo proxy/preview degradado.
- Dependência de libs de visão: oferecer fallback heurístico sem IA.
- Compatibilidade codec/container: validar com matrizes de teste e perfis FFmpeg pré‑homologados.

## Critérios de Aceite
- Timeline exibe batidas e sugere cortes com precisão >= 90% em clipes musicais.
- Suavização automática reduz cortes duros e mantém sync AV em E2E.
- Color match elimina discrepâncias visíveis entre clipes adjacentes em > 80% dos casos.
- Exportação aprovada em todos os formatos com legendas, metadados e capas; sem artefatos.
- UI mantém playback fluido em projetos com 100+ faixas e duração > 4 horas.

Confirma prosseguir com esta implementação? 