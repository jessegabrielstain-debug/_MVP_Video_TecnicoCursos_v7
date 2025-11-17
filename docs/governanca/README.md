# Governança Contínua (Fase 4)

## Ritmo
- Reunião semanal (sexta) para status e riscos.
- Revisão de arquitetura e segurança trimestral (jan/abr/jul/out).
- Stage Gates: fim de cada fase com dossiê de evidências.

## Scripts
| Função | Comando |
|--------|---------|
| Atualizar KPIs (coverage + any) | `npm run kpis:update` |
| Relatório semanal | `npm run report:weekly` |
| Matriz de riscos | `ts-node scripts/governanca/update-risk-matrix.ts` |
| Auditoria RLS | `ts-node scripts/rls-audit.ts` |
| Auditoria dependências | `ts-node scripts/security/deps-audit.ts` |
| Saúde worker BullMQ | `ts-node scripts/health/worker-health.ts` |
| Criar release (manifest) | `ts-node scripts/release/create-release.ts` |
| Atualizar KPIs + append histórico | `ts-node scripts/update-kpis.ts` |

### Testes Analytics
- Core: `estudio_ia_videos/app/__tests__/lib/analytics/render-core.test.ts`
- Rota cache: `estudio_ia_videos/app/__tests__/api/render-stats-route.test.ts` (X-Cache MISS/HIT + 401)

## Artefatos
- KPIs: `docs/governanca/kpis.json`
- Relatórios semanais: `docs/reports/YYYY-WXX-status.md`
- Matriz riscos atualizada: `docs/riscos/matriz-atualizada.md`

## Próximos Aprimoramentos
- Integração MTTR automática (post-mortem → update-kpis).
- Dashboard consolidado via página `/admin/governanca` (futuro consumo de kpis.json).
- Histórico de releases exibido em UI com rollback assistido.
# Governança Técnica — MVP Vídeo TécnicoCursos v7

Este documento consolida a cadência, responsabilidades e artefatos mínimos de governança descritos no plano de fases.

## Cadência
- Weekly sync (30 min): status, riscos, decisões.
- Stage Gate ao fim de cada fase: evidências, métricas e GO/NO-GO.

## Artefatos obrigatórios
- ADRs em `docs/adr/` para decisões arquiteturais.
- Evidências por fase em `evidencias/fase-n/` (relatórios, prints, logs).
- Relatórios semanais curtos em `docs/reports/`.

## Responsabilidades resumidas
- Sponsor: priorização e remoção de impedimentos; aprova Stage Gate.
- Tech Lead: padrões técnicos, revisão de entregas críticas.
- Devs: execução, testes, documentação.
- QA: estratégia de testes, automação e qualidade.
- DevOps/SRE: CI/CD, monitoramento, incidentes.
