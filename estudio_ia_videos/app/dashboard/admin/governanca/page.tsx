import fs from 'fs';
import path from 'path';

interface KPIData {
  coverage_core: number;
  any_remaining: number;
  mttr_minutes: number | null;
  deploy_frequency_weekly: number;
  change_failure_rate: number | null;
  history: Array<{ ts: string; coverage_core?: number; any_remaining?: number; diff?: Record<string, number> }>;
}

function readKPIs(): KPIData | null {
  try {
    const p = path.join(process.cwd(), 'docs', 'governanca', 'kpis.json');
    return JSON.parse(fs.readFileSync(p, 'utf8')) as KPIData;
  } catch { return null; }
}

interface ReleaseManifest { id: string; tag?: string; createdAt: string; commit: string; coverageStatementsPct?: number; anyRemaining?: number; }

function readReleases(): ReleaseManifest[] {
  const dir = path.join(process.cwd(), 'releases');
  try {
    const files = fs.readdirSync(dir).filter(f => f.startsWith('release-') && f.endsWith('.json'));
    return files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as ReleaseManifest; } catch { return null; }
    }).filter(Boolean) as ReleaseManifest[];
  } catch { return []; }
}

export default function GovernancaDashboard() {
  const kpis = readKPIs();
  const releases = readReleases().sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1)).slice(0,10);
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Governança — Painel Técnico</h1>
      {!kpis && <p className="text-red-600">KPIs não encontrados.</p>}
      {kpis && (
        <div className="grid md:grid-cols-3 gap-4">
          <Metric title="Coverage Core" value={`${kpis.coverage_core.toFixed(2)}%`}/>
          <Metric title="Any Restantes" value={String(kpis.any_remaining)}/>
          <Metric title="MTTR (min)" value={kpis.mttr_minutes != null ? String(kpis.mttr_minutes) : '—'}/>
          <Metric title="Deploys/sem" value={String(kpis.deploy_frequency_weekly)}/>
          <Metric title="Change Failure Rate" value={kpis.change_failure_rate != null ? `${kpis.change_failure_rate.toFixed(2)}%` : '—'}/>
        </div>
      )}
      <section>
        <h2 className="text-xl font-medium mb-2">Últimos Releases</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <Th>Data</Th><Th>ID</Th><Th>Commit</Th><Th>Coverage</Th><Th>Any</Th>
              </tr>
            </thead>
            <tbody>
              {releases.map(r => (
                <tr key={r.id} className="border-t">
                  <Td>{new Date(r.createdAt).toLocaleString()}</Td>
                  <Td>{r.tag || r.id}</Td>
                  <Td className="font-mono text-xs">{r.commit.slice(0,7)}</Td>
                  <Td>{r.coverageStatementsPct != null ? `${r.coverageStatementsPct.toFixed(2)}%` : '—'}</Td>
                  <Td>{r.anyRemaining != null ? r.anyRemaining : '—'}</Td>
                </tr>
              ))}
              {releases.length === 0 && (
                <tr><Td colSpan={5}>Nenhum release manifesto encontrado.</Td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {kpis?.history && kpis.history.length > 0 && (
        <section>
          <h2 className="text-xl font-medium mb-2">Histórico (últimos 10)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border">
              <thead className="bg-gray-100"><tr><Th>Timestamp</Th><Th>Coverage</Th><Th>Any</Th><Th>ΔCoverage</Th><Th>ΔAny</Th></tr></thead>
              <tbody>
              {kpis.history.slice(-10).reverse().map(h => (
                <tr key={h.ts} className="border-t">
                  <Td>{new Date(h.ts).toLocaleString()}</Td>
                  <Td>{h.coverage_core != null ? `${h.coverage_core.toFixed(2)}%` : '—'}</Td>
                  <Td>{h.any_remaining != null ? h.any_remaining : '—'}</Td>
                  <Td>{h.diff?.coverage_core != null ? h.diff.coverage_core.toFixed(2) : '—'}</Td>
                  <Td>{h.diff?.any_remaining != null ? h.diff.any_remaining : '—'}</Td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded border p-4 bg-white shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function Th({ children }: { children: any }) { return <th className="px-2 py-1 text-left font-medium">{children}</th>; }
function Td({ children, colSpan }: { children: any; colSpan?: number }) { return <td colSpan={colSpan} className="px-2 py-1">{children}</td>; }
