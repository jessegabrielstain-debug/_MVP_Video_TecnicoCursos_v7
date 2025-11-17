#!/usr/bin/env ts-node
/**
 * Script: update-kpis.ts
 * Atualiza métricas em docs/governanca/kpis.json a partir de artefatos gerados (coverage-summary.json, any-report.json).
 * - coverage_core: usa porcentagem de statements do coverage total.
 * - any_remaining: conta de ocorrências em evidencias/fase-1/any-report.json.
 * - mttr_minutes: permanece se já houver valor; TODO futura integração com incidentes.
 * - deploy_frequency_weekly: placeholder (0) até integrar com histórico de releases.
 * - change_failure_rate: placeholder até integrar com incidentes.
 * Adiciona entrada de histórico com timestamp e diffs.
 */
import { promises as fs } from 'fs';
import path from 'path';

interface KPIs {
  coverage_core: number;
  any_remaining: number;
  mttr_minutes: number | null;
  deploy_frequency_weekly: number;
  change_failure_rate: number | null;
  history: Array<Record<string, unknown>>;
}

async function readJSON<T>(p: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function main() {
  const root = process.cwd();
  const kpisPath = path.join(root, 'docs', 'governanca', 'kpis.json');
  const coverageCandidates = [
    path.join(root, 'coverage', 'coverage-summary.json'),
    path.join(root, 'estudio_ia_videos', 'app', 'coverage', 'coverage-summary.json'),
    path.join(root, 'jest-coverage-app', 'coverage-summary.json')
  ];
  let coverage: any = null;
  for (const c of coverageCandidates) {
    if (await exists(c)) {
      coverage = await readJSON<any>(c, {});
      break;
    }
  }
  const anyReportPath = path.join(root, 'evidencias', 'fase-1', 'any-report.json');
  const anyReport = await readJSON<any>(anyReportPath, { anyCount: null });
  const mttrPath = path.join(root, 'evidencias', 'fase-4', 'mttr.json');
  const mttr = await readJSON<any>(mttrPath, { mttr_minutes: null });
  const kpis: KPIs = await readJSON<KPIs>(kpisPath, {
    coverage_core: 0,
    any_remaining: 0,
    mttr_minutes: null,
    deploy_frequency_weekly: 0,
    change_failure_rate: null,
    history: []
  });

  let coveragePct = kpis.coverage_core;
  if (coverage && coverage.total && coverage.total.statements && typeof coverage.total.statements.pct === 'number') {
    coveragePct = coverage.total.statements.pct;
  }

  const anyRemaining = typeof anyReport.anyCount === 'number' ? anyReport.anyCount : kpis.any_remaining;

  const previous = { coverage_core: kpis.coverage_core, any_remaining: kpis.any_remaining };
  kpis.coverage_core = coveragePct;
  kpis.any_remaining = anyRemaining;
  if (mttr.mttr_minutes != null) {
    kpis.mttr_minutes = mttr.mttr_minutes;
  }

  const record = {
    ts: new Date().toISOString(),
    coverage_core: coveragePct,
    any_remaining: anyRemaining,
    mttr_minutes: kpis.mttr_minutes,
    diff: {
      coverage_core: coveragePct - previous.coverage_core,
      any_remaining: anyRemaining - previous.any_remaining
    }
  };
  kpis.history.push(record);

  await fs.writeFile(kpisPath, JSON.stringify(kpis, null, 2), 'utf8');
  console.log(JSON.stringify({ updated: true, record }, null, 2));
}

async function exists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

main().catch(err => {
  console.error('Falha update-kpis:', err);
  process.exit(1);
});
