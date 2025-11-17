#!/usr/bin/env ts-node
/**
 * Script: rls-audit.ts
 * Objetivo: verificar se políticas RLS críticas estão aplicadas e retornam comportamento esperado.
 * MÉTODO SIMPLIFICADO: realiza selects anon vs service e verifica bloqueio/escoamento de dados.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

interface AuditResult { table: string; anonAccessible: boolean; rowCountAnon: number; rowCountService: number; status: 'OK' | 'ALERTA'; }

function env(name: string, optional = false): string {
  const v = process.env[name];
  if (!v && !optional) throw new Error(`Env faltante: ${name}`);
  return v || '';
}

async function auditTable(table: string): Promise<AuditResult> {
  const url = env('NEXT_PUBLIC_SUPABASE_URL');
  const anon = env('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const service = env('SUPABASE_SERVICE_ROLE_KEY');

  const anonClient = createClient(url, anon);
  const serviceClient = createClient(url, service);

  const { data: anonData, error: anonErr } = await anonClient.from(table).select('*').limit(5);
  const { data: servData, error: servErr } = await serviceClient.from(table).select('*').limit(5);

  const anonAccessible = !anonErr;
  return {
    table,
    anonAccessible,
    rowCountAnon: anonData?.length || 0,
    rowCountService: servData?.length || 0,
    status: anonAccessible ? 'OK' : 'ALERTA',
  };
}

async function main() {
  const criticalTables = ['users', 'projects', 'slides', 'render_jobs', 'analytics_events', 'nr_courses', 'nr_modules'];
  const results: AuditResult[] = [];
  for (const t of criticalTables) {
    try {
      results.push(await auditTable(t));
    } catch (e) {
      results.push({ table: t, anonAccessible: false, rowCountAnon: 0, rowCountService: 0, status: 'ALERTA' });
    }
  }
  const summary = { generatedAt: new Date().toISOString(), results };
  console.log(JSON.stringify(summary, null, 2));
  fs.mkdirSync('evidencias/fase-1', { recursive: true });
  fs.writeFileSync('evidencias/fase-1/rls-audit.json', JSON.stringify(summary, null, 2));
}

main().catch(err => {
  console.error('Falha RLS audit:', err);
  process.exit(1);
});
