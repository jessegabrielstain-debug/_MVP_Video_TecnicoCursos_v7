# Alertas de Fila (BullMQ)

## Secrets necessários no GitHub

- `PRODUCTION_URL`: URL base da app (ex: https://seu-dominio.vercel.app)
- `SLACK_WEBHOOK`: Webhook para canal de alertas

## Workflow

Arquivo: `.github/workflows/queue-monitoring.yml`

- Executa a cada 15 minutos
- Lê `/api/queue/metrics`
- Dispara alerta Slack se:
  - `failed > 0` ou
  - `waiting > 100` ou
  - `delayed > 50`

## Ajuste de thresholds

Edite o job `Alert thresholds` no YAML para alterar os limites conforme necessidade de operação.

## Teste local

```pwsh
cd estudio_ia_videos; npm run dev
node ..\scripts\test-queue-metrics.js
```
