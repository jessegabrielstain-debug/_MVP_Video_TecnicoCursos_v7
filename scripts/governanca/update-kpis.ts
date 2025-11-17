#!/usr/bin/env ts-node
import { readFileSync, writeFileSync } from 'fs';

type KPIs = Record<string, any>;

function load(): KPIs {
  try { return JSON.parse(readFileSync('docs/governanca/kpis.json','utf-8')); } catch { return {}; }
}

function save(obj: KPIs) {
  writeFileSync('docs/governanca/kpis.json', JSON.stringify(obj, null, 2));
}

function main() {
  const data = load();
  const ts = new Date().toISOString();
  // Exemplo de atualização incremental
  data.last_update = ts;
  if (!data.history) data.history = [];
  data.history.push({ ts, coverage_core: data.coverage_core || 0, any_remaining: data.any_remaining || 0 });
  save(data);
  console.log('KPIs atualizados:', ts);
}

main();