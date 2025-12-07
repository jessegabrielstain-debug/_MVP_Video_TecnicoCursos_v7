import { getDashboardData } from '@/lib/monitoring/dashboard-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshButton } from './refresh-button';
import { Activity, Server, Clock, CheckCircle, Database } from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Métricas - Admin',
  description: 'Métricas detalhadas do sistema',
};

export default async function MetricsPage() {
  const data = await getDashboardData();
  const { render, system, timestamp } = data;

  // Helper to format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Helper to format bytes
  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Operacional</h1>
          <p className="text-muted-foreground">
            Métricas em tempo real do sistema de renderização e infraestrutura.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Atualizado: {new Date(timestamp).toLocaleTimeString()}
          </span>
          <RefreshButton />
        </div>
      </div>

      {/* Render Pipeline Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Jobs (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{render.basic.total_renders}</div>
            <p className="text-xs text-muted-foreground">
              {render.basic.successful_renders} concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {render.basic.success_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {render.basic.failed_renders} falhas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio Render</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(render.basic.avg_render_time * 1000)}
            </div>
            <p className="text-xs text-muted-foreground">
              P95: {formatDuration((render.performance.p95_render_time ?? 0) * 1000)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fila Atual</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{render.queue.current_queue_length}</div>
            <p className="text-xs text-muted-foreground">
              {render.queue.processing_jobs} processando agora
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Error Analysis */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Análise de Erros</CardTitle>
            <CardDescription>
              Distribuição de erros por categoria nas últimas 24 horas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {render.errors.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhum erro registrado no período.
                </div>
              ) : (
                render.errors
                  .sort((a, b) => b.count - a.count)
                  .map((error) => {
                    const totalFailed = render.basic.failed_renders || 1;
                    const percentage = (error.count / totalFailed) * 100;
                    return (
                      <div key={error.category} className="flex items-center">
                        <div className="w-full space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {error.category}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {error.count} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary">
                            <div
                              className="h-2 rounded-full bg-destructive"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Saúde do Sistema</CardTitle>
            <CardDescription>
              Métricas de infraestrutura e runtime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {system.metrics.filter(m => m.name === 'process_memory_usage_bytes').map((metric, i) => (
                <div key={i} className="flex items-center">
                  <Server className="mr-4 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Memória (Heap)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Uso atual do processo Node.js
                    </p>
                  </div>
                  <div className="font-bold">
                    {formatBytes(metric.value)}
                  </div>
                </div>
              ))}

              {system.metrics.filter(m => m.name === 'process_uptime_seconds').map((metric, i) => (
                <div key={i} className="flex items-center">
                  <Clock className="mr-4 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Uptime
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tempo de atividade do serviço
                    </p>
                  </div>
                  <div className="font-bold">
                    {formatDuration(metric.value * 1000)}
                  </div>
                </div>
              ))}
              
              <div className="flex items-center">
                 <Activity className="mr-4 h-4 w-4 text-muted-foreground" />
                 <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Status da API
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Healthcheck interno
                    </p>
                 </div>
                 <div className="font-bold text-green-500">
                    ONLINE
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}