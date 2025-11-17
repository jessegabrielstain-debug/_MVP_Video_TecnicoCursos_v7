# Deploy & Rollback (Fase 3)

## Objetivo
Padronizar publicação em staging e garantir rollback rápido (<10 min).

## Scripts
- Deploy: `scripts/deploy/deploy-staging.sh`
- Rollback: `scripts/deploy/rollback-staging.sh` (placeholder para lógica de releases numeradas)

## Fluxo de Deploy
1. Validar CI verde.
2. Executar script de deploy em staging.
3. Rodar testes smoke (`npm run test:e2e:playwright`).
4. Gerar relatórios Lighthouse (`npm run perf:lighthouse`).
5. Aprovar promoção para produção.

## Fluxo de Rollback
1. Identificar release anterior (`releases/` numeradas – a implementar).
2. Executar script com parâmetro do release.
3. Validar saúde e testes básicos.
4. Registrar incidente e motivo no runbook.

## Próximos aprimoramentos
- Implementar estrutura `releases/` com hash do commit.
- Guardar build artefatos para restauração rápida.
- Automatizar verificação pós-deploy (Web Vitals + API health).
