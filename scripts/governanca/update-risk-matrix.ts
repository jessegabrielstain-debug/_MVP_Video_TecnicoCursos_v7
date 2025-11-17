#!/usr/bin/env ts-node
import { readFileSync, writeFileSync } from 'fs';

interface Risk { id: string; description: string; probability: number; impact: number; category: string; status?: string; }

function load(): Risk[] {
  try { return JSON.parse(readFileSync('docs/riscos/matriz-fase0.json','utf-8')); } catch { return []; }
}

function score(prob: number, impact: number) { return prob * impact; }

function classify(s: number) {
  if (s <= 3) return 'verde';
  if (s <= 6) return 'amarelo';
  return 'vermelho';
}

function main() {
  const risks = load();
  const enriched = risks.map(r => ({ ...r, score: score(r.probability, r.impact), level: classify(score(r.probability, r.impact)) }));
  const md = ['# Matriz de Riscos Atualizada','', '| ID | Descrição | Categoria | Prob | Impacto | Score | Classificação | Status |','|----|-----------|----------|------|---------|-------|---------------|--------|'];
  for (const r of enriched) {
    md.push(`| ${r.id} | ${r.description} | ${r.category} | ${r.probability} | ${r.impact} | ${r.score} | ${r.level} | ${r.status || ''} |`);
  }
  writeFileSync('docs/riscos/matriz-atualizada.md', md.join('\n'));
  console.log('Matriz de riscos atualizada: docs/riscos/matriz-atualizada.md');
}

main();