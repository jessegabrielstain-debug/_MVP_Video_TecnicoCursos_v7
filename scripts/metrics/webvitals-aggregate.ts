#!/usr/bin/env ts-node
/**
 * Script: webvitals-aggregate.ts
 * Agrega métricas Web Vitals armazenadas em analytics_events (event_type: web_vitals)
 * Calcula média e p90 de LCP, FID, CLS; salva evidencias/fase-3/webvitals.json.
 */
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

function env(name: string, optional = false) { const v = process.env[name]; if (!v && !optional) throw new Error(`Env faltante: ${name}`); return v || ''; }

interface VitalRow { created_at: string; event_data: any; }

function percentile(values: number[], p: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b)=>a-b);
  const idx = Math.ceil((p/100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

async function main() {
  const url = env('NEXT_PUBLIC_SUPABASE_URL');
  const service = env('SUPABASE_SERVICE_ROLE_KEY');
  const client = createClient(url, service);
  const { data, error } = await client.from('analytics_events').select('created_at,event_data').eq('event_type','web_vitals');
  if (error) throw error;
  const lcp: number[] = [], fid: number[] = [], cls: number[] = [];
  (data as VitalRow[]).forEach(r => {
    let payload: any = r.event_data;
    if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch { /* ignore */ } }
    if (payload?.lcp != null) lcp.push(Number(payload.lcp));
    if (payload?.fid != null) fid.push(Number(payload.fid));
    if (payload?.cls != null) cls.push(Number(payload.cls));
  });
  const out = {
    generatedAt: new Date().toISOString(),
    count: lcp.length,
    lcp_mean: lcp.length ? lcp.reduce((a,b)=>a+b,0)/lcp.length : null,
    fid_mean: fid.length ? fid.reduce((a,b)=>a+b,0)/fid.length : null,
    cls_mean: cls.length ? cls.reduce((a,b)=>a+b,0)/cls.length : null,
    lcp_p90: percentile(lcp,90),
    fid_p90: percentile(fid,90),
    cls_p90: percentile(cls,90)
  };
  console.log(JSON.stringify(out,null,2));
  const dir = path.join(process.cwd(),'evidencias','fase-3');
  await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'webvitals.json'), JSON.stringify(out,null,2),'utf8');
}

main().catch(err => { console.error('Falha webvitals-aggregate:', err); process.exit(1); });
