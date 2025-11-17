# Objetivo
Preparar um PRD completo e acionável para o projeto “MVP Video TécnicoCursos v7”, consolidando visão de produto, escopo, requisitos funcionais e não funcionais, fluxos, critérios de aceite, riscos e roadmap. O documento será prático para planejamento, desenvolvimento, QA e tomada de decisão.

## Fontes de Verdade
1. README.md (visão geral, status, métricas, stack)
2. docs/ e _Fases_REAL/ (fases, guias, checklists e testes)
3. estudio_ia_videos/app (Next.js, app router, libs, APIs)
4. .trae/documents/PRD_Editor_Video_PPTX.md (subsistema do Editor/PPTX)

## Estrutura do PRD
1. Visão Geral
   - Problema, público-alvo, proposta de valor, diferenciais
   - Alinhamento com cursos NR (NR12, NR33, NR35)
2. Objetivos de Negócio e KPIs
   - Tempo de produção reduzido, taxa de sucesso de render, adoção de templates, NPS
3. Escopo e Não Escopo (MVP vs. Próximas fases)
   - MVP: Upload/Parser PPTX, Editor Visual (ordenar slides), Fila de Render (Remotion/FFmpeg), Compliance NR, Analytics, Storage, Auth
   - Fora do escopo imediato: Avatares 3D avançados, colaboração em tempo real completa, marketplace de templates
4. Personas e Casos de Uso
   - Instrutor/Conteudista, Coordenador de Treinamento, Equipe de Operações
5. Requisitos Funcionais por Módulo
   5.1 Upload/Parser PPTX
   5.2 Editor Visual (ordenar, preview, metadados)
   5.3 Fila de Renderização (jobs, progresso, retries, formatos)
   5.4 Compliance NR (templates, validações, trilhas)
   5.5 Analytics (eventos, agregações, relatórios)
   5.6 Autenticação/Autorização (Supabase, RLS)
   5.7 Notificações e WebSocket (status de jobs)
   5.8 Armazenamento e Downloads (Supabase Storage, políticas)
   5.9 Administração (usuários, projetos, limites)
6. Fluxos Principais (Diagramas Mermaid)
   - Upload → Parser → Editor → Fila → Render → Storage → Download
   - Login → Dashboard → Projetos → Analytics
7. Regras de Negócio
   - Limites de tamanho/slide, políticas de reprocessamento, SLA de fila, retenção de dados
8. Modelo de Dados (alto nível)
   - Tabelas: users, projects, slides, render_jobs, analytics_events, nr_courses, nr_modules
   - Buckets: videos, avatars, thumbnails, assets
9. Integrações e APIs
   - Next.js API Routes: pptx, video, notifications
   - Supabase: Postgres, Storage, Auth
   - Remotion/FFmpeg: pipeline de render
10. Requisitos Não Funcionais
   - Segurança: RLS, segregação por usuário, chaves, CSP
   - Performance: tempos de parse/render, filas, caching
   - Confiabilidade: retries, idempotência, monitoramento
   - Observabilidade: logs, métricas (health, render rate)
   - Acessibilidade e UX: responsividade desktop-first, feedbacks
11. Restrições e Dependências
   - Node 18+, Supabase, FFmpeg, Vercel/Railway/AWS
12. Riscos e Mitigações
   - Cache Supabase, custos de render, tamanhos de arquivo, falhas de upload
13. Roadmap e Marcos
   - Hoje, 1 semana, 1 mês (staging, produção, features TTS/avatares)
14. Critérios de Aceite (por módulo)
   - Critérios mensuráveis para Upload, Editor, Render, Compliance, Analytics
15. Sucesso e Métricas
   - Engajamento, % renders concluídos, tempo médio de produção, erros por 1k jobs
16. Anexos
   - Referências de documentação existente e links internos

## Entregáveis
- PRD completo em texto (Português), com diagramas mermaid simples
- Lista de critérios de aceite por módulo
- Tabela de KPIs priorizados e alvos iniciais

## Forma de Entrega
- Entrega como documento pronto para revisão (sem criar arquivos no repositório até aprovação)
- Opcional: versão PDF após aprovação

## Observações de Adequação
- Alinhar seções com o que já está implementado (status 100% operacional)
- Reutilizar e integrar conteúdo do PRD do Editor/PPTX quando aplicável

## Próximo Passo
Após sua confirmação, elaboro o PRD completo com o conteúdo final e exemplos práticos por módulo, mantendo aderência às implementações atuais e à terminologia do projeto.