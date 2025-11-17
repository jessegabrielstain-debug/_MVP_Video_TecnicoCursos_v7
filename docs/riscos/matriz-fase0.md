# Matriz de Riscos - Fase 0 (Diagnóstico)







**Data de Criação:** 13/11/2025  



**Responsável:** Ana S. (Sponsor) + Bruno L. (Tech Lead)  



**Status:** ⏳ Em andamento  



**Objetivo:** Identificar, classificar e mitigar riscos críticos antes de avançar para a Fase 1.







---







## Metodologia de Classificação







### Probabilidade



- **Baixa (1):** < 20% de chance de ocorrer



- **Média (2):** 20-60% de chance de ocorrer



- **Alta (3):** > 60% de chance de ocorrer







### Impacto



- **Baixo (1):** Atraso < 1 semana, sem impacto em stakeholders



- **Médio (2):** Atraso 1-2 semanas, impacto moderado em funcionalidades



- **Alto (3):** Atraso > 2 semanas, bloqueio de entrega ou comprometimento de segurança







### Score de Risco



**Score = Probabilidade × Impacto**



- **1-3 (Verde):** Risco aceitável, monitorar



- **4-6 (Amarelo):** Risco médio, plano de mitigação ativo



- **7-9 (Vermelho):** Risco crítico, ação imediata







---







## Riscos Identificados







### R001 - RLS Mal Configurada (Vazamento de Dados)







| Campo | Valor |



|-------|-------|



| **Categoria** | Segurança |



| **Descrição** | Políticas RLS ausentes ou incorretas podem permitir acesso não autorizado a dados de outros usuários. |



| **Fase Afetada** | Fase 0, Fase 1 |



| **Probabilidade** | Média (2) |



| **Impacto** | Alto (3) |



| **Score** | 6 (Amarelo) |



| **Owner** | Diego R. (DevOps/SRE) |



| **Gatilho de Monitoramento** | Execução de `scripts/rls-audit.ts` detecta gaps |



| **Plano de Mitigação** | 1. Executar `scripts/rls-audit.ts` até 15/01<br>2. Criar políticas faltantes até 17/01<br>3. Testes de isolamento (Fase 2) |



| **Status** | ⚠️ Em análise |



| **Evidências** | `evidencias/fase-0/auditoria-integracoes.md`, `evidencias/fase-0/rls-audit.txt` |







---







### R002 - Variáveis de Ambiente Não Validadas







| Campo | Valor |



|-------|-------|



| **Categoria** | Operacional |



| **Descrição** | Falta de validação de env vars pode causar falhas silenciosas em produção ou staging. |



| **Fase Afetada** | Fase 0, todas as fases |



| **Probabilidade** | Alta (3) |



| **Impacto** | Alto (3) |



| **Score** | 9 (Vermelho) |



| **Owner** | Diego R. (DevOps/SRE) |



| **Gatilho de Monitoramento** | Execução de `scripts/validate-environment.ts` falha |



| **Plano de Mitigação** | 1. Executar `scripts/validate-environment.ts` até 14/01<br>2. Corrigir variáveis faltantes/inválidas<br>3. Adicionar validação ao CI (Fase 1) |



| **Status** | ✅ Mitigado (13/11/2025) |



| **Evidências** | `evidencias/fase-0/env-validation.txt` |







---







### R003 - Worker de Render Sem Auto-Restart







| Campo | Valor |



|-------|-------|



| **Categoria** | Operacional |



| **Descrição** | Worker `render-worker.ts` precisa ser iniciado manualmente. Se cair, jobs não são processados até restart manual. |



| **Fase Afetada** | Fase 0, Fase 1, Fase 2 |



| **Probabilidade** | Alta (3) |



| **Impacto** | Médio (2) |



| **Score** | 6 (Amarelo) |



| **Owner** | Diego R. + Bruno L. |



| **Gatilho de Monitoramento** | Fila BullMQ com jobs pendentes > 30 min sem processamento |



| **Plano de Mitigação** | 1. Implementar health-check endpoint (Fase 2)<br>2. Configurar auto-restart (PM2, systemd ou supervisord)<br>3. Alertas Slack quando worker está down |



| **Status** | ⚠️ Planejado para Fase 2 |



| **Evidências** | `evidencias/fase-0/auditoria-integracoes.md` |







---







### R004 - Buckets Supabase Não Criados







| Campo | Valor |



|-------|-------|



| **Categoria** | Técnica |



| **Descrição** | Buckets `videos`, `avatars`, `thumbnails`, `assets` podem não existir, bloqueando upload/download de arquivos. |



| **Fase Afetada** | Fase 0, Fase 1 |



| **Probabilidade** | Média (2) |



| **Impacto** | Alto (3) |



| **Score** | 6 (Amarelo) |



| **Owner** | Diego R. (DevOps/SRE) |



| **Gatilho de Monitoramento** | Teste de upload falha com erro 404 (bucket not found) |



| **Plano de Mitigação** | 1. Verificar buckets no Supabase Dashboard até 15/01<br>2. Criar buckets faltantes com políticas corretas<br>3. Documentar procedimento em `scripts/setup-supabase-auto.ts` |



| **Status** | ⚠️ Em verificação |



| **Evidências** | `evidencias/fase-0/auditoria-integracoes.md` |







---







### R005 - Falta de Monitoramento de Filas BullMQ







| Campo | Valor |



|-------|-------|



| **Categoria** | Operacional |



| **Descrição** | Sem dashboard/alertas, não sabemos se filas estão paradas, com alto throughput de falhas ou jobs atrasados. |



| **Fase Afetada** | Fase 0, Fase 1, Fase 2 |



| **Probabilidade** | Alta (3) |



| **Impacto** | Médio (2) |



| **Score** | 6 (Amarelo) |



| **Owner** | Carla M. + Diego R. |



| **Gatilho de Monitoramento** | Jobs atrasados > 1h detectados em query manual |



| **Plano de Mitigação** | 1. Implementar BullMQ Board ou UI customizada (Fase 2)<br>2. Configurar alertas (jobs parados, high failure rate)<br>3. Exportar métricas para Grafana |



| **Status** | ⚠️ Planejado para Fase 2 |



| **Evidências** | `evidencias/fase-0/auditoria-integracoes.md` |







---







### R006 - Dívida Técnica: 2191 Problemas de Lint







| Campo | Valor |



|-------|-------|



| **Categoria** | Técnica |



| **Descrição** | Relatório de lint detectou 2191 problemas (2104 erros, 87 avisos), indicando dívida técnica alta e risco de bugs. |



| **Fase Afetada** | Fase 0, Fase 1 |



| **Probabilidade** | Alta (3) |



| **Impacto** | Médio (2) |



| **Score** | 6 (Amarelo) |



| **Owner** | Bruno L. (Tech Lead) |



| **Gatilho de Monitoramento** | Número de problemas de lint aumenta em PRs |



| **Plano de Mitigação** | 1. Executar `eslint --fix` para resolver ~100 problemas automáticos (até 20/01)<br>2. Criar plano de ataque por categoria (unsafe-*, no-explicit-any, unused-vars)<br>3. Zerar dívida até fim da Fase 1 (14/02) |



| **Status** | ⚠️ Plano de ação em andamento |



| **Evidências** | `evidencias/fase-0/lint-typecheck.md` |







---







### R007 - Uso Extensivo de `any` (4.734 ocorrências)







| Campo | Valor |



|-------|-------|



| **Categoria** | Técnica |



| **Descrição** | 4.734 ocorrências de tipo `any` e 37 arquivos com `@ts-nocheck` anulam segurança de tipos do TypeScript. |



| **Fase Afetada** | Fase 0, Fase 1 |



| **Probabilidade** | Alta (3) |



| **Impacto** | Médio (2) |



| **Score** | 6 (Amarelo) |



| **Owner** | Bruno L. + Laura F. |



| **Gatilho de Monitoramento** | Baseline de `any` coletado por `scripts/audit-any.ts` |



| **Plano de Mitigação** | 1. Executar `scripts/audit-any.ts` e salvar baseline (até 17/01)<br>2. Criar plano de ataque por domínio (api, lib, app)<br>3. Zerar `any` até fim da Fase 1 (14/02) |



| **Status** | ⚠️ Baseline pendente |



| **Evidências** | Plano menciona 4.734 `any` e 37 `@ts-nocheck` (13/01) |







---







### R008 - Rate Limiting Inconsistente







| Campo | Valor |



|-------|-------|



| **Categoria** | Segurança |



| **Descrição** | Implementação utilitária de rate limit existe em `lib/utils/rate-limit.ts`, mas não é aplicada consistentemente em endpoints. |



| **Fase Afetada** | Fase 1, Fase 3 |



| **Probabilidade** | Média (2) |



| **Impacto** | Médio (2) |



| **Score** | 4 (Amarelo) |



| **Owner** | Bruno L. |



| **Gatilho de Monitoramento** | Teste `scripts/test-contract-video-jobs-rate-limit.js` falha |



| **Plano de Mitigação** | 1. Revisar todos os endpoints `app/api/v1/**` (Fase 1)<br>2. Aplicar rate limit apropriado<br>3. Testar cobertura (Fase 3) |



| **Status** | ⚠️ Planejado para Fase 3 |



| **Evidências** | `evidencias/fase-0/auditoria-integracoes.md` |







---







### R009 - Secrets Sem Política de Rotação







| Campo | Valor |



|-------|-------|



| **Categoria** | Segurança |



| **Descrição** | Chaves críticas (Supabase Service Role, Redis Token) não têm política de rotação, aumentando risco de comprometimento. |



| **Fase Afetada** | Todas as fases |



| **Probabilidade** | Baixa (1) |



| **Impacto** | Alto (3) |



| **Score** | 3 (Verde) |



| **Owner** | Ana S. + Diego R. |



| **Gatilho de Monitoramento** | Auditoria de segurança trimestral |



| **Plano de Mitigação** | 1. Definir política de rotação (a cada 90 dias) até 31/03<br>2. Documentar procedimento em `docs/governanca/README.md`<br>3. Configurar lembretes no calendário |



| **Status** | ✅ Aceito (baixo risco imediato) |



| **Evidências** | `evidencias/fase-0/auditoria-integracoes.md` |







---







### R010 - Falta de Testes E2E (Playwright)







| Campo | Valor |



|-------|-------|



| **Categoria** | Qualidade |



| **Descrição** | Não existem testes end-to-end cobrindo fluxos críticos (upload → render → dashboard), aumentando risco de regressões. |



| **Fase Afetada** | Fase 1, Fase 2 |



| **Probabilidade** | Alta (3) |



| **Impacto** | Médio (2) |



| **Score** | 6 (Amarelo) |



| **Owner** | Carla M. + Felipe T. |



| **Gatilho de Monitoramento** | Deploy em staging sem testes automatizados |



| **Plano de Mitigação** | 1. Criar ambiente sanitized (staging)<br>2. Implementar suite Playwright `tests/e2e/video-flow.spec.ts` (Fase 2)<br>3. Integrar ao pipeline noturno |



| **Status** | ⚠️ Planejado para Fase 2 |



| **Evidências** | Plano menciona ausência de testes E2E |







---







### R011 - Indisponibilidade do Supabase







| Campo | Valor |



|-------|-------|



| **Categoria** | Operacional |



| **Descrição** | Dependência total do Supabase sem fallback. Indisponibilidade bloqueia toda a aplicação. |



| **Fase Afetada** | Todas as fases |



| **Probabilidade** | Baixa (1) |



| **Impacto** | Alto (3) |



| **Score** | 3 (Verde) |



| **Owner** | Diego R. (DevOps/SRE) |



| **Gatilho de Monitoramento** | Health-check falha, monitoramento Sentry detecta |



| **Plano de Mitigação** | 1. Configurar monitoramento proativo do Supabase<br>2. Estabelecer SLA com fornecedor<br>3. Avaliar estratégia de failover (custos vs. benefício) na Fase 4 |



| **Status** | ✅ Aceito (SLA Supabase é 99.9%) |



| **Evidências** | `evidencias/fase-0/auditoria-integracoes.md` |







---







### R012 - Indisponibilidade do Redis (Upstash)







| Campo | Valor |



|-------|-------|



| **Categoria** | Operacional |



| **Descrição** | Redis down bloqueia enfileiramento de jobs de render, paralisando geração de vídeos. |



| **Fase Afetada** | Todas as fases |



| **Probabilidade** | Baixa (1) |



| **Impacto** | Alto (3) |



| **Score** | 3 (Verde) |



| **Owner** | Diego R. (DevOps/SRE) |



| **Gatilho de Monitoramento** | Health-check Redis falha |



| **Plano de Mitigação** | 1. Configurar alertas de conectividade<br>2. Avaliar fallback (processar síncronamente em emergências)<br>3. Monitorar quotas Upstash |



| **Status** | ✅ Aceito (SLA Upstash é 99.9%) |



| **Evidências** | `evidencias/fase-0/auditoria-integracoes.md` |







---







### R013 - Falta de Cobertura de Testes (Coverage < 70%)







| Campo | Valor |



|-------|-------|



| **Categoria** | Qualidade |



| **Descrição** | Cobertura de testes atual não é medida. Meta: ≥70% em módulos core, ≥60% geral. |



| **Fase Afetada** | Fase 1, Fase 2 |



| **Probabilidade** | Alta (3) |



| **Impacto** | Médio (2) |



| **Score** | 6 (Amarelo) |



| **Owner** | Carla M. (QA) |



| **Gatilho de Monitoramento** | Baseline de coverage não coletado |



| **Plano de Mitigação** | 1. Configurar `nyc` ou cobertura Jest (Fase 2)<br>2. Coletar baseline até 21/02<br>3. Atingir meta até 07/03 |



| **Status** | ⚠️ Planejado para Fase 2 |



| **Evidências** | Plano menciona ausência de baseline |







---







### R014 - Flakiness em Testes de Contrato







| Campo | Valor |



|-------|-------|



| **Categoria** | Qualidade |



| **Descrição** | Testes de contrato (`scripts/test-contract-video-jobs-*.js`) podem falhar intermitentemente por dados não isolados. |



| **Fase Afetada** | Fase 1, Fase 2 |



| **Probabilidade** | Média (2) |



| **Impacto** | Baixo (1) |



| **Score** | 2 (Verde) |



| **Owner** | Carla M. (QA) |



| **Gatilho de Monitoramento** | Testes falhando randomicamente no CI |



| **Plano de Mitigação** | 1. Usar fixtures consistentes e teardown após testes<br>2. Isolar dados de teste (Supabase sanitized)<br>3. Revisar suites na Fase 2 |



| **Status** | ✅ Monitorar (baixo impacto) |



| **Evidências** | Plano menciona risco de flakiness |







---







### R015 - Falta de Documentação Operacional







| Campo | Valor |



|-------|-------|



| **Categoria** | Operacional |



| **Descrição** | Playbooks de deploy/rollback, runbooks de incidentes e documentação operacional incompletos. |



| **Fase Afetada** | Fase 1, Fase 2, Fase 3 |



| **Probabilidade** | Alta (3) |



| **Impacto** | Médio (2) |



| **Score** | 6 (Amarelo) |



| **Owner** | Diego R. + Carla M. |



| **Gatilho de Monitoramento** | Incidente onde time não sabe como responder |



| **Plano de Mitigação** | 1. Criar `docs/operacao/playbook-incidentes.md` (Fase 2)<br>2. Documentar procedimentos de deploy/rollback (Fase 3)<br>3. Treinar equipe com simulações (GameDay - Fase 4) |



| **Status** | ⚠️ Planejado para Fase 2/3 |



| **Evidências** | Plano menciona ausência de runbooks |







---







## Resumo de Riscos por Categoria







| Categoria | Verde (1-3) | Amarelo (4-6) | Vermelho (7-9) | Total |



|-----------|-------------|---------------|----------------|-------|



| Técnica | 1 | 3 | 0 | 4 |



| Operacional | 3 | 4 | 1 | 8 |



| Segurança | 1 | 2 | 0 | 3 |



| Qualidade | 1 | 2 | 0 | 3 |



| **Total** | **6** | **11** | **1** | **18** |







---







## Riscos Críticos (Vermelho) - Ação Imediata







### R002 - Variáveis de Ambiente Não Validadas (Score 9)



**Ação:** Executar `scripts/validate-environment.ts` até 14/01 e corrigir todas as variáveis faltantes/inválidas.  



**Responsável:** Diego R.  



**Prazo:** 14/01/2025







---







## Riscos Médios (Amarelo) - Plano de Mitigação Ativo







Os 11 riscos amarelos estão distribuídos entre as Fases 1, 2 e 3 com planos de mitigação claros e owners designados. Ver seções individuais acima para detalhes.







---







## Riscos Aceitáveis (Verde) - Monitorar







Os 6 riscos verdes são de baixa prioridade imediata mas devem ser monitorados em rituais de revisão trimestral (Fase 4).







---







## Próximos Passos







1. **Revisar matriz com stakeholders** - Reunião com Ana S., Bruno L., Diego R. e Carla M. até 15/01



2. **Priorizar riscos críticos (vermelho)** - Executar ações imediatas



3. **Atualizar matriz quinzenalmente** - Durante cerimônias de acompanhamento



4. **Arquivar riscos mitigados** - Com aprendizados documentados em `docs/riscos/riscos-arquivados.md`



5. **Integrar com backlog** - Vincular cards de mitigação aos riscos correspondentes







---







**Registro de Mudanças:**



- 13/11/2025: Criação inicial com 15 riscos identificados na Fase 0.



