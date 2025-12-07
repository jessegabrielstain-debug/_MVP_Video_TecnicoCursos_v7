# Plano de Implementação – Editor de Vídeo e Módulo PPTX

## Visão Geral
- Objetivo: aproveitar módulos prontos de mercado para oferecer um editor de vídeo web “state-of-the-art” e um fluxo PPTX inteligente, reduzindo desenvolvimento do zero e cobrindo dores recorrentes (edição colaborativa, automação, import/export).
- Estratégia: combinar um fork guiado de um editor timeline web (Motionity) com pipelines de renderização confiáveis (FFmpeg/Remotion) e uma camada PPTX modular (PptxGenJS, pptx-automizer, python-pptx) conectada ao back-end existente.
- Resultado esperado: MVP robusto em poucas sprints, com base escalável para IA, colaboração tempo real e automações corporativas.

## Stack Recomendada (Links diretos)

### PPTX – Geração, Parsing e Conversão
- [gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS) – Biblioteca JS madura para gerar/editar PPTX no browser ou Node, suporte a temas, charts, media embedding.
- [sfeir-open-source/pptx-automizer](https://github.com/sfeir-open-source/pptx-automizer) – Motor de template/merge para cenários enterprise (preenche slides com JSON/Excel, reaproveita PPTX existentes).
- [gitbrent/officegen](https://github.com/gitbrent/officegen) – Alternativa Node para gerar Office (útil para jobs server-side).
- [python-openxml/python-pptx](https://github.com/python-openxml/python-pptx) – Microserviço Python para parsing profundo, extração de texto/imagens e automação avançada.
- [marp-team/marp](https://github.com/marp-team/marp) – Markdown → slides (HTML/PDF/PPTX) para fluxos automáticos e templates rápidos.
- [ONLYOFFICE/DocumentServer](https://github.com/ONLYOFFICE/DocumentServer) – Edição colaborativa de Office via web; pode servir PPTX preview/edição live sem reinventar UI.

### Editor de Vídeo – UI e Motor de Timeline
- [alyssaxuu/motionity](https://github.com/alyssaxuu/motionity) – Editor timeline 2D/vídeo open-source (PWA); base para UX, layers, keyframes, export web-friendly.
- [remotion-dev/remotion](https://github.com/remotion-dev/remotion) – Framework React para criar vídeos programaticamente; ideal para render server-side e templates de motion graphics.
- [ffmpegwasm/ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) – FFmpeg compilado para WebAssembly, útil para pré-visualização e tarefas leves no browser.
- [vidstack/player](https://github.com/vidstack/player) – Player moderno (Web Components/React) com suporte a timeline, chapters, low-latency streaming.
- [wseen/timeline](https://github.com/wseen/timeline) – Componente timeline WebGL (caso precise modularizar Motionity ou criar painéis customizados).
- [remotion-dev/lambda](https://github.com/remotion-dev/lambda) – Render distribuído de projetos Remotion em infraestrutura serverless.
- [goproxy/remotion-playground](https://github.com/goproxy-io/remotion-playground) – Ambiente exemplo conectando Remotion + backend Node/FFmpeg.

### 3D, Avatares Falantes e Drag-and-Drop
- [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) – Renderizador React para Three.js; base para cenários 3D e sobreposição de cenas na timeline.
- [pmndrs/drei](https://github.com/pmndrs/drei) – Coleção de helpers para acelerar iluminação, câmeras e controles 3D.
- [readyplayerme/AvatarCreator](https://github.com/readyplayerme/AvatarCreator) – SDK web para criar/embutir avatares 3D personalizáveis com suporte a glTF.
- [alievk/avatarify-python](https://github.com/alievk/avatarify-python) – Referência de lip-sync em tempo real para avatares “talking head”.
- [DanielSWolf/rhubarb-lip-sync](https://github.com/DanielSWolf/rhubarb-lip-sync) – Ferramenta para gerar visemes e sincronizar boca com áudio em pipelines 2D/3D.
- [coqui-ai/TTS](https://github.com/coqui-ai/TTS) – Síntese de voz neural multi-idioma para narradores hiperrealistas.
- [clauderic/dnd-kit](https://github.com/clauderic/dnd-kit) – Toolkit drag-and-drop acessível para React, ideal para timeline/asset bins.
- [stripe/react-stripe-js/tree/master/examples/three-drag-drop](https://github.com/stripe/react-stripe-js/tree/master/examples/three-drag-drop) – Exemplo avançado de integração drag-and-drop no canvas 3D (referência de UX).

### Pipelines de Render, Distribuição e Automação
- [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg) – Motor principal para render, transcode, thumbs, sprites, áudio.
- [temporalio/temporal](https://github.com/temporalio/temporal) – Orquestrador de workflows distribuídos (render, pós-processamento, notificações) resiliente.
- [bullmq/bullmq](https://github.com/taskforcesh/bullmq) – Filas Redis-friendly já utilizadas no ecossistema Node.
- [garden-io/baker](https://github.com/garden-io/baker) ou [golemfactory/yagna](https://github.com/golemfactory/yagna) – Render distribuído via containers ou rede Golem se precisar escalar GPU/CPU sob demanda.
- [zulko/moviepy](https://github.com/Zulko/moviepy) – Ferramentas Python para manipulação server-side (útil em jobs avançados ou integração com IA).

### Inteligência Artificial e Efeitos “Next-Gen”
- [google/mediapipe](https://github.com/google/mediapipe) – Detecção de cenas, gestos, rostos; base para cortes automáticos, highlights.
- [openai/openai-cookbook](https://github.com/openai/openai-cookbook) – Scripts prontos para legendas, transcrição, geração de roteiro a partir de vídeo/áudio.
- [facebookresearch/audiocraft](https://github.com/facebookresearch/audiocraft) – Geração e mixagem de áudio; pode apoiar trilhas, efeitos.
- [runwayml/latent-consistency-model](https://github.com/runwayml/latent-consistency-model) – Geração e stylization frame a frame (para features inovadoras).
- [huggingface/transformers](https://github.com/huggingface/transformers) – Base para sumarização automática de scripts, geração de captions multi-idioma.
- [lablab-ai/whisper-ui](https://github.com/lablab-ai/whisper-ui) – Interface de transcrição baseada em Whisper, útil para fluxo de legendas.
- [brandonroberts/timeline-tailwind](https://github.com/brandonroberts/timeline-tailwind) – Inspiração UI para timeline responsiva em Tailwind.
- [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) – Render 3D declarativo para React, base para cenas volumétricas.
- [Dimsome/react-three-gpu-pathtracer](https://github.com/Dimsome/react-three-gpu-pathtracer) – Exemplo de path tracing em tempo real para looks cinematográficos.
- [greats3an/p5.sketches](https://github.com/greats3an/p5.sketches) – Shaders/efeitos generativos que podem ser aplicados como filtros em composições Remotion.
- [PIFuHD/pifuhd](https://github.com/facebookresearch/pifuhd) – Reconstrução 3D a partir de fotos (útil para gerar avatares realistas de usuários finais).

### Colaboração, Observabilidade e UX
- [supabase/supabase](https://github.com/supabase/supabase) – Já presente; aproveitar Auth/Realtime para colaboração na timeline.
- [liveblocks/liveblocks](https://github.com/liveblocks/liveblocks) – SDK realtime pris ready (presence, comments, history).
- [PostHog/posthog](https://github.com/PostHog/posthog) – Telemetria e heatmaps para entender UX.
- [getsentry/sentry](https://github.com/getsentry/sentry) – Monitoramento de erros front/back.
- [netlify/netlify-cms](https://github.com/netlify/netlify-cms) ou [Directus/directus](https://github.com/directus/directus) – Gestão de assets/metadados se precisar painel no-code.

## Estratégia de Integração
- **Fork curado do Motionity** para estabelecer timeline, layers, keyframes. Remover features não usadas, adaptar estilos (Tailwind/PostCSS), inserir hooks de upload existente.
- **Remotion + FFmpeg** como camada de render oficial: Remotion gera composição React → ffmpeg renderiza master, múltiplos formatos, legendas embutidas.
- **Pipeline PPTX híbrido**: PptxGenJS no front para gerar previews (JSON→slides) + microserviço python-pptx/pptx-automizer para merge e validação no servidor.
- **Bridge PPTX ↔ Vídeo**: Converter slides em sequências (png/mp4) com Remotion/FFmpeg para usar como base de storytelling automático.
- **IA & automações** plugáveis: jobs independente (Mediapipe para corte, OpenAI para scripts/legendas). Entregar como ações no editor (“Gerar cortes sugeridos”).
- **Avatares e 3D hiper-realistas**: usar React Three Fiber + Ready Player Me para criação/edição de personagens; Rhubarb/Avatarify para sincronizar boca e expressões; permitir drag-and-drop de avatares/cenas diretamente na timeline.
- **Colaboração**: Liveblocks/Supabase Realtime para presença simultânea no projeto, comentários, histórico. Sincronizar via CRDTs ou WebSocket central.
- **Observabilidade**: Instrumentar com PostHog (eventos editor) + Sentry (erros) + dashboards de fila (BullMQ + Temporal Web UI).

## Roadmap em Fases

### Fase 0 – Descoberta e Provas de Conceito (1–2 semanas)
- Validar dores principais com editores (upload pesado, cortes repetitivos, sincronização PPTX↔vídeo).
- Clonar Motionity + Remotion, levantar prova de vida integrando com dados fictícios.
- Avaliar conversores PPTX (PptxGenJS, pptx-automizer, python-pptx) usando apresentações reais do cliente.
- Testar rapidamente geração de avatares (Ready Player Me) e lip-sync automático (Rhubarb) com vídeo real, garantindo potencial hiper-realista.
- Definir critérios de sucesso (tempo de render, QA de slides, responsividade, colaboração).

### Fase 1 – Fundamentos Técnicos (2–3 semanas)
- Incorporar fork do Motionity no front (`estudio_ia_videos`), com autenticação existente.
- Integrar pipeline de upload → processamento FFmpeg (thumbs, proxies, waveforms).
- Implementar microserviço PPTX inicial: upload, validação, extração de metadados, geração de preview PNG.
- Orquestrar jobs com BullMQ; configurar storage (S3 compatível ou Supabase Storage).
- Introduzir drag-and-drop unificado (dnd-kit) para timeline, biblioteca de mídias e posicionamento de elementos 3D.
- Montar base 3D com React Three Fiber + Drei para cenas e avatares, com fallback 2D.
- Testes de performance (render local, preview timeline) + setup de logs/telemetria (Sentry/PostHog).

### Fase 2 – Automação e Template Engine (3–4 semanas)
- Amarrar Remotion para gerar vídeos baseados em templates PPTX (slides → cenas animadas).
- Integrar pptx-automizer para preencher apresentações a partir de JSON (dados de cursos, roteiros).
- Adicionar IA de produtividade: transcrição automática (OpenAI Whisper), geração de legendas e capítulos.
- Criar biblioteca de templates: Motionity + Remotion + PPTX padronizados (branding, lower thirds, call-to-action).
- Incorporar biblioteca de avatares (Ready Player Me) com painel drag-and-drop; permitir substituição de vozes via Coqui TTS e lip-sync Rhubarb.
- Configurar pipeline PIFuHD para gerar avatares 3D a partir de fotos aprovadas, com validação manual.
- Disponibilizar painel de gerenciamento de assets com busca (Meilisearch/Directus).

### Fase 3 – Colaboração Tempo Real e IA Avançada (3–4 semanas)
- Implementar colaboração live (Liveblocks/Supabase Realtime) com locking inteligente, comentários por timestamp/slide.
- Rodar pipelines Mediapipe para detectar cenas, remover trechos silenciosos, sugerir cortes e overlays.
- Introduzir geração de efeitos/estilos (Latent Consistency Model) e áudio AI (Audiocraft) como opções controladas.
- Integrar Avatarify/pipelines de facial tracking para expressões faciais em tempo real dos avatares.
- Lançar “stage 3D” com iluminação e câmeras editáveis via drag-and-drop, permitindo sequências virtuais e realidade aumentada.
- Criar fluxo de aprovação/revisão (histórico de versões, comparar renders).
- Instrumentar métricas avançadas: tempo em cada etapa, taxa de uso de sugestões IA, erros por usuário.

### Fase 4 – Escalabilidade, Segurança e Finishing (2–3 semanas)
- Migrar orquestração crítica para Temporal (maior resiliência) / workers auto-escaláveis (Kubernetes, Golem GPU se necessário).
- Harden de segurança: antivírus ao subir PPTX/Vídeo, validação de macros, scan de conteúdo, auditoria detalhada.
- Otimizar custos: cache de renders, uso de proxies, autoscaling, reutilização de assets.
- Garantir suporte a pipelines 3D pesados (compressão glTF/Draco, streaming de texturas, LOD).
- Completar documentação (manuais operacionais, guias de template, troubleshooting) + treinamentos.
- Planejar roadmap longo (SDK público, APIs, monetização) a partir de feedback coletado.

## Métricas Principais (monitorar por sprint)
- Tempo médio para gerar preview PPTX (<5s) e render final (<15 min para 10 min de vídeo).
- % de automações usadas (cortes sugeridos aceitos, legendas geradas).
- Latência de colaboração (<300 ms para atualização de timeline/slide).
- Taxa de erro por upload/render (<2%).
- Satisfação dos editores (NPS interno, pesquisa quinzenal).

## Riscos e Mitigações
- **Inconsistência de formatos PPTX** → fallback via ONLYOFFICE DocumentServer para edição manual e validação antes do merge.
- **Performance WebAssembly** (ffmpeg.wasm) → limitar a previews curtos, delegar render pesado ao servidor.
- **Complexidade UX** → testes com grupo piloto, remover features pouco usadas, onboarding guiado e drag-and-drop acessível.
- **Custos de IA** → cachear resultados (transcrições), usar modelos locais quando possível (Whisper.cpp, LLaMA 3.1 via Ollama).
- **Escalabilidade** → planejar infra containerizada desde Fase 1, monitorar filas e autoscale antes de gargalos.

## Boas Práticas Essenciais
- Garantir exportação glTF/GLB otimizada (Draco, KTX2) para cenários 3D leves e compatíveis com Web.
- Validar lip-sync automatizado com revisões humanas; oferecer ajuste fino manual no editor.
- Centralizar assets (texturas, malhas, áudios) com versionamento e CDN; aplicar fingerprint para cache busting.
- Padronizar drag-and-drop com feedback visual (snap em tracks, magnetismo de keyframes) e suporte a teclado (acessibilidade).
- Manter componentes 3D isolados (Figma → React Three Fiber) com testes visuais (Storybook) para evitar regressões.

## Próximos Passos Imediatos
- Criar board de benchmarking listando critérios (licença, comunidade, integração) e avaliar cada repositório acima.
- Subir branch `motionity-integration-poc` com PoC de timeline + upload real.
- Configurar microserviço python-pptx mínimo para validar conversões, conectá-lo ao fluxo atual (`production-pptx-upload.tsx`).
- Apresentar resultados de Fase 0 em workshop com editores e ajustar prioridades antes de Fase 1.
