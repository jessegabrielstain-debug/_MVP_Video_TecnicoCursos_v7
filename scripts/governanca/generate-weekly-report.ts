#!/usr/bin/env ts-node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

function safeRead(path: string) {
  try { return readFileSync(path, 'utf-8'); } catch { return ''; }
}

function parseJSON(path: string) {
  try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

function collectKPIs() {
  const kpis = parseJSON('docs/governanca/kpis.json') || {};
  return kpis;
}

function collectArtifacts() {
  return {
    coverage: safeRead('evidencias/fase-2/cobertura.md').length > 0,
    contractSuite: existsSync('evidencias/fase-2/contract-suite-result.json'),
    pptxSuite: existsSync('evidencias/fase-2/pptx-suite-result.json'),
    supabaseDashboard: existsSync('evidencias/fase-2/supabase-dashboard.json'),
    lighthouse: safeRead('evidencias/fase-3/lighthouse-dashboard.html').length > 0
  };
}

function weekNumber(d: Date) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const millis = d.getTime() - oneJan.getTime();
  return Math.floor(millis / (1000 * 60 * 60 * 24 * 7)) + 1;
}

function main() {
  const now = new Date();
  const year = now.getFullYear();
  const week = weekNumber(now);
  const kpis = collectKPIs();
  const artifacts = collectArtifacts();
  const outDir = 'docs/reports';
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, `${year}-W${String(week).padStart(2, '0')}-status.md`);
  const content = `# Relatório Semanal ${year}-W${week}\n\nData geração: ${now.toISOString()}\n\n## KPIs\n\n\n${Object.entries(kpis).map(([k,v]) => `- ${k}: ${JSON.stringify(v)}`).join('\n')}\n\n## Artefatos\n${Object.entries(artifacts).map(([k,v]) => `- ${k}: ${v ? 'OK' : 'PENDENTE'}`).join('\n')}\n\n## Observações\n- Relatório gerado automaticamente.\n`;
  writeFileSync(file, content);
  console.log('Relatório gerado:', file);
}

main();