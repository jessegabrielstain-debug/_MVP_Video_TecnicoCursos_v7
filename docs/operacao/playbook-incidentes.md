# Playbook de Incidentes

> Versão inicial – será enriquecido conforme alerta BullMQ/Sentry forem ativados.

## 1. Classificação
| Severidade | Critério | Exemplo | Ação inicial |
|-----------|---------|---------|--------------|
| SEV0 | Indisponibilidade total do fluxo crítico (render + dashboard) | Todas as páginas retornam 5xx | Acionar todos (war-room) |
| SEV1 | Degradação severa (fila parada > 15 min, erros 5xx > 20%) | Jobs não avançam | Escalar para DevOps + Tech Lead |
| SEV2 | Impacto moderado (erro isolado em módulo, lentidão) | Endpoint analytics lento | Registrar e mitigar sem war-room |
| SEV3 | Baixo impacto / ruído | Log de warning recorrente | Avaliar em rotina semanal |

## 2. Fluxo de Resposta
1. Detecção (alerta automático Sentry/BullMQ ou reporte Slack).
2. Nomear Incident Commander (IC) – responsável por coordenação e comunicação.
3. Contenção: rollback, feature flag, pausa de workers.
4. Diagnóstico: coleta de métricas (`scripts/collect-queue-metrics.ts` a criar), logs estruturados, eventos Sentry.
5. Mitigação definitiva ou plano temporário documentado.
6. Post-mortem em até 48h: causas raiz, ações preventivas, owners e prazos.

## 3. Funções Durante Incidente
- IC: coordena, decide prioridades, mantém canal `#incidentes` limpo.
- Tech Lead: valida hipóteses técnicas e aprova rollback.
- DevOps/SRE: opera infraestrutura (Redis, Supabase, workers, deploys).
- QA/Observabilidade: coleta artefatos, confirma impacto do usuário.
- Produto/Sponsor: comunica externamente (se necessário) e prioriza follow-up.

## 4. Canais & Comunicação
- Slack `#incidentes`: tempo real; somente fatos e atualizações numeradas.
- Documento vivo: `evidencias/incidentes/YYYY-MM-DD-<slug>.md` criado ao abrir SEV0/SEV1.
- Status público (interno): atualizar entrada em `docs/reports/2025-WXX-status.md`.

## 5. Métricas Chave
- MTTA (Mean Time To Acknowledge) – alvo < 5 min.
- MTTR (Mean Time To Recovery) – alvo < 30 min SEV1, < 60 min SEV0.
- Erros 5xx por minuto (limite alerta: > 50/min).
- Latência média fila BullMQ (tempo em waiting > 10 min dispara alerta).

## 6. Critérios de Encerramento
- Serviço principal recuperado (dashboard e jobs processando).
- Causa raiz identificada ou plano de descoberta pendente aprovado pelo Tech Lead.
- Ações preventivas listadas com owners e deadlines.

## 7. Template de Registro (Post-mortem)
```
Título: SEV1 – Fila de render parada
Data/Horário: 2025-11-17 14:32 BRT – 15:05 BRT
IC: @diego.devops
Impacto: 42 jobs atrasados (>20 min), usuários sem atualização de progresso.
Linha do tempo:
  - 14:32 alerta Slack (bullmq_stalled)
  - 14:34 confirmação de impacto
  - 14:40 pausa de novos enqueues
  - 14:46 ajuste de conexão Redis + restart worker
  - 14:52 jobs retomam processamento
  - 15:05 fila normalizada
Raiz (5 porquês): conexão saturada por burst de métricas → falta de pool → config default não adequada.
Mitigação: aumentar `maxRetriesPerRequest`, adicionar pooling explícito.
Preventivas: script de auto-restart + alerta de backlog > X (Owner, prazo).
Evidências: logs/incident-2025-11-17.json, screenshot dashboard.
Checklist concluído: sim
```

## 8. Próximas Evoluções
- Integrar geração automática de relatório via Action em incidentes SEV0/SEV1.
- Adicionar correlação de trace id (Sentry) nos logs estruturados via logger.
- Criar playbook específico para indisponibilidade Supabase.

## 9. Referências
- `SECURITY.md`
- `docs/riscos/matriz-fase0.md`
- ADRs de observabilidade (`docs/adr/ADR-002-observabilidade-monitoramento.md`)

---
Atualização inicial criada em 17/11/2025. Revisar após ativação de alertas BullMQ/Sentry.
