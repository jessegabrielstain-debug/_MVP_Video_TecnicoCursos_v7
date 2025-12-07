'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface HistoryItem {
  ts: string;
  coverage_core?: number;
  any_remaining?: number;
  diff?: Record<string, number>;
}

interface GovernanceChartsProps {
  history: HistoryItem[];
}

export function GovernanceCharts({ history }: GovernanceChartsProps) {
  // Format data for charts
  const data = history.map(item => ({
    ...item,
    date: new Date(item.ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    fullDate: new Date(item.ts).toLocaleString('pt-BR'),
    coverage: item.coverage_core || 0,
    any: item.any_remaining || 0
  })).reverse(); // Show oldest to newest

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="text-lg font-medium mb-4 text-gray-700">Evolução de Cobertura (%)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
              <Tooltip 
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.fullDate;
                  }
                  return label;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="coverage" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorCoverage)" 
                name="Cobertura Core"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="text-lg font-medium mb-4 text-gray-700">Redução de 'any' (Tipagem)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip 
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.fullDate;
                  }
                  return label;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="any" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Any Restantes"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
