'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend
} from 'recharts';

interface ChartProps {
  data: any[];
  height?: number;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

/**
 * Gráfico de barras simples
 */
export function SimpleBarChart({ data, height = 300, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico de linha para tendências
 */
export function TrendLineChart({ data, height = 300, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico de pizza para distribuições
 */
export function DistributionPieChart({ data, height = 300, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props) => {
              const { name, value, percent } = props as unknown as { name: string; value: number; percent: number };
              return `${name}: ${value} (${(percent * 100).toFixed(0)}%)`;
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico de área para métricas ao longo do tempo
 */
export function TimelineAreaChart({ data, height = 300, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="events" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="users" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
          <Area type="monotone" dataKey="errors" stackId="1" stroke="#ffc658" fill="#ffc658" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico composto para múltiplas métricas
 */
export function ComposedMetricsChart({ data, height = 300, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Contagem" />
          <Line yAxisId="right" type="monotone" dataKey="avgTime" stroke="#ff7300" name="Tempo Médio (ms)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico de barras horizontais
 */
export function HorizontalBarChart({ data, height = 300, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={100} />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico de performance com múltiplas linhas
 */
export function PerformanceChart({ data, height = 300, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="loadTime" stroke="#8884d8" name="Tempo de Carregamento" />
          <Line type="monotone" dataKey="renderTime" stroke="#82ca9d" name="Tempo de Renderização" />
          <Line type="monotone" dataKey="processingTime" stroke="#ffc658" name="Tempo de Processamento" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico de funil para conversão
 */
export function ConversionFunnelChart({ data, height = 300, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="stage" />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: any) => [
              `${value} usuários`, 
              name === 'users' ? 'Usuários' : name
            ]}
          />
          <Bar dataKey="users" fill="#8884d8" />
          <Bar dataKey="conversion" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico de heatmap simplificado
 */
export function HeatmapChart({ data, height = 300, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="activity" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Componente de métricas em tempo real
 */
export function RealTimeMetrics({ data, className }: { data: any; className?: string }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{data.activeUsers || 0}</div>
        <div className="text-sm text-blue-500">Usuários Ativos</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{data.eventsPerMinute || 0}</div>
        <div className="text-sm text-green-500">Eventos/min</div>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">{data.avgResponseTime || 0}ms</div>
        <div className="text-sm text-yellow-500">Tempo Médio</div>
      </div>
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-red-600">{data.errorRate || 0}%</div>
        <div className="text-sm text-red-500">Taxa de Erro</div>
      </div>
    </div>
  );
}

/**
 * Componente de comparação de períodos
 */
export function PeriodComparisonChart({ data, height = 300, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="metric" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="current" fill="#8884d8" name="Período Atual" />
          <Bar dataKey="previous" fill="#82ca9d" name="Período Anterior" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}