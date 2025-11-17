#!/usr/bin/env ts-node
import { Client } from 'pg';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

async function main() {
  const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL/DIRECT_DATABASE_URL ausente');
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  const tables = await client.query("select table_name from information_schema.tables where table_schema='public'");
  const policies = await client.query("select tablename, policyname, permissive, roles from pg_policies order by tablename");
  const rlsEnabled = await client.query("select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relkind='r'");
  const counts: Record<string, number> = {};
  for (const row of tables.rows) {
    const name = row.table_name;
    try {
      const ct = await client.query(`select count(*)::int as c from "${name}"`);
      counts[name] = ct.rows[0].c;
    } catch {
      counts[name] = -1;
    }
  }
  const payload = {
    generated_at: new Date().toISOString(),
    table_count: tables.rows.length,
    tables: tables.rows.map(r => r.table_name),
    row_counts: counts,
    rls_policies: policies.rows,
    rls_enabled: rlsEnabled.rows,
  };
  const outPath = 'evidencias/fase-2/supabase-dashboard.json';
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  await client.end();
  console.log('Export concluído:', outPath);
}

main().catch(err => { console.error(err); process.exit(1); });