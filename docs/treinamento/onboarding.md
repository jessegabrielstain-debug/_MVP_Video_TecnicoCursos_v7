# Onboarding Técnico – Plataforma Vídeo TécnicoCursos

> Objetivo: habilitar novos colaboradores a contribuir com segurança em até 5 dias úteis.

## Dia 1 – Fundamentos
- Ler `README.md`, `CONTRIBUTING.md`, `SECURITY.md`.
- Clonar repositório, configurar `.env.local` via `create-env.ps1`.
- Rodar `npm install`, `npm run validate:env`, `npm run setup:supabase`.
- Executar `npm run dev` e acessar fluxo PPTX (upload simples).

## Dia 2 – Arquitetura & Serviços
- Estudar `docs/fluxos/fluxos-core.md` (diagramas principais).
- Revisar centralização em `estudio_ia_videos/app/lib/services/` (supabase, redis, bullmq, logger, monitoring).
- Ler ADRs: `0001-validacao-tipagem.md`, `0002-job-states.md`, `0004-centralizacao-servicos.md`.

## Dia 3 – Qualidade & Testes
- Rodar `npm run audit:any` e entender saída `evidencias/fase-1/any-report.json`.
- Executar suites `npm run test:contract` e `npm run test:suite:pptx`.
- Ler `docs/testes/` (seções de camadas) e plano de evolução E2E.

## Dia 4 – Observabilidade & Operação
- Revisar `docs/operacao/playbook-incidentes.md` e métricas esperadas.
- Validar integração Sentry (quando ativa) criando erro de teste local.
- Inspecionar fila BullMQ com script de exemplo (`scripts/dev/inspect-queue.ts` futuro).

## Dia 5 – Contribuição Guiada
- Abrir pequena PR removendo um `any` em domínio simples (ex.: helpers).
- Adicionar validação Zod a um endpoint secundário.
- Atualizar um documento: checklist ou adicionar seção de melhorias.
- Participar de revisão com Tech Lead (feedback).

## Checklist de Conclusão
- [ ] Ambiente local configurado e builds passando.
- [ ] Execução bem sucedida dos scripts de testes e quality.
- [ ] Compreensão dos fluxos core e serviços centrais.
- [ ] 1 PR merged (qualidade ou refatoração leve).
- [ ] Leitura dos ADRs críticos.
- [ ] Leitura do playbook de incidentes.

## Referências Rápidas
- Scripts principais: `npm run setup:supabase`, `npm run audit:any`, `npm run test:contract`, `npm run test:suite:pptx`.
- Pastas: `estudio_ia_videos/app/lib/services/`, `scripts/`, `docs/`, `supabase/`.
- Canal Slack: `#projeto-profissionalizacao`.

## Próximas Evoluções
- Adicionar trilha de BullMQ avançado.
- Adicionar sessão gravada sobre RLS e auditoria.
- Incluir exercícios práticos de testes Playwright (quando implementados).

---
Documento inicial criado em 17/11/2025 – revisar trimestralmente.
