# Performance e Otimização (Fase 3)

## Objetivos
Garantir Lighthouse ≥ 90 nas páginas principais e tempos de resposta consistentes em rotas críticas.

## Métricas Alvo
- Lighthouse Score (Dashboard / Job Detail) ≥ 90
- LCP < 2.5s, CLS < 0.1
- Tempo médio de renderização de vídeo (pipeline) documentado

## Estratégias Planejadas
1. Substituir imagens estáticas por `next/image` com lazy loading.
2. Carregar componentes pesados via dynamic import (`next/dynamic`).
3. Cache de respostas estáveis (ex.: analytics) com TTL.
4. CDN para assets públicos (thumbnails, avatars).
5. Compressão (`gzip` ou `brotli`) verificada no edge.

## Checklist de Execução
- [ ] Mapear rotas com carga lenta inicial.
- [ ] Medir baseline Lighthouse.
- [ ] Aplicar otimizações priorizadas (Quick Wins primeiro).
- [ ] Reexecutar Lighthouse e salvar relatórios em `evidencias/fase-3/`.
- [ ] Documentar ganhos percentuais e regressões.

## Scripts Planejados
`scripts/performance/run-lighthouse.ts` (a criar) para gerar relatórios HTML/JSON.

## Evidências
Salvar relatórios: `evidencias/fase-3/lighthouse-dashboard.html`, `evidencias/fase-3/lighthouse-job-detail.html`.

## Próximos Passos
1. Criar script Lighthouse automatizado.
2. Integrar execução opcional no workflow nightly.
3. Monitorar métricas Web Vitals via `web-vitals` e enviar para endpoint interno.
