#!/usr/bin/env ts-node
/**
 * Script: mttr-calc.ts
 * Calcula MTTR (Mean Time To Recovery) baseado em eventos analytics_events:
 *  - incident_opened { incidentId }
 *  - incident_resolved { incidentId }
 * Saída: evidencias/fase-4/mttr.json com mttr_minutes e lista de incidentes.
 */
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

function env(name: string, optional = false) {
  const v = process.env[name];
  if (!v && !optional) throw new Error(`Env faltante: ${name}`);
  return v || '';
}

async function main() {
  const url = env('NEXT_PUBLIC_SUPABASE_URL');
  const service = env('SUPABASE_SERVICE_ROLE_KEY');
  const client = createClient(url, service);
  const { data, error } = await client.from('analytics_events').select('created_at,event_type,event_data');
  if (error) throw error;
  type Entry = { created_at: string; event_type: string; event_data: any };
  const incidents = new Map<string, { opened?: Date; resolved?: Date }>();
  (data as Entry[]).forEach(e => {
    let payload: any = e.event_data;
    if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch { /* ignore */ } }
    const id = payload?.incidentId;
    if (!id) return;
    const rec = incidents.get(id) || {};
    if (e.event_type === 'incident_opened') rec.opened = new Date(e.created_at);
    if (e.event_type === 'incident_resolved') rec.resolved = new Date(e.created_at);
    incidents.set(id, rec);
  });
  const durations: number[] = [];
  const list = Array.from(incidents.entries()).map(([id, v]) => {
    let minutes: number | null = null;
    if (v.opened && v.resolved) {
      minutes = (v.resolved.getTime() - v.opened.getTime()) / 60000;
      durations.push(minutes);
    }
    return { incidentId: id, opened_at: v.opened?.toISOString(), resolved_at: v.resolved?.toISOString(), duration_minutes: minutes };
  });
  const mttr = durations.length ? (durations.reduce((a,b)=>a+b,0) / durations.length) : null;
  const output = { generatedAt: new Date().toISOString(), mttr_minutes: mttr, incidents: list };
  console.log(JSON.stringify(output, null, 2));
  const dir = path.join(process.cwd(), 'evidencias', 'fase-4');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'mttr.json'), JSON.stringify(output, null, 2), 'utf8');
}

main().catch(err => { console.error('Falha mttr-calc:', err); process.exit(1); });
