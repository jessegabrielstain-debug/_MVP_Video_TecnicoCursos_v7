'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Clock, CheckCircle, XCircle, Pause } from 'lucide-react';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

interface Job {
  id: string;
  name: string;
  data: any;
  progress: number;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
}

interface QueueData {
  stats: QueueStats;
  jobs: {
    waiting: Job[];
    active: Job[];
    completed: Job[];
    failed: Job[];
  };
}

export default function QueuesPage() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/queues');
      if (!response.ok) {
        throw new Error('Failed to fetch queue data');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Atualizar a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Erro: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fila de Renderização</h1>
          <p className="text-muted-foreground">Monitore jobs de renderização de vídeo</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          Atualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.waiting}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativo</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluído</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhou</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasado</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.delayed}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Ativos ({data.stats.active})</TabsTrigger>
          <TabsTrigger value="waiting">Aguardando ({data.stats.waiting})</TabsTrigger>
          <TabsTrigger value="completed">Concluídos ({data.stats.completed})</TabsTrigger>
          <TabsTrigger value="failed">Falhos ({data.stats.failed})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <JobsList jobs={data.jobs.active} type="active" />
        </TabsContent>

        <TabsContent value="waiting" className="space-y-4">
          <JobsList jobs={data.jobs.waiting} type="waiting" />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <JobsList jobs={data.jobs.completed} type="completed" />
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <JobsList jobs={data.jobs.failed} type="failed" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JobsList({ jobs, type }: { jobs: Job[]; type: string }) {
  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Nenhum job {type === 'waiting' ? 'aguardando' : type === 'active' ? 'ativo' : type === 'completed' ? 'concluído' : 'falho'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{job.name || 'Render Job'}</CardTitle>
              <Badge variant={type === 'failed' ? 'destructive' : type === 'completed' ? 'default' : 'secondary'}>
                {type}
              </Badge>
            </div>
            <CardDescription>ID: {job.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {job.progress > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progresso</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Tentativas:</span> {job.attemptsMade}
              </div>
              {job.timestamp && (
                <div>
                  <span className="text-muted-foreground">Criado:</span>{' '}
                  {new Date(job.timestamp).toLocaleString('pt-BR')}
                </div>
              )}
              {job.processedOn && (
                <div>
                  <span className="text-muted-foreground">Processado:</span>{' '}
                  {new Date(job.processedOn).toLocaleString('pt-BR')}
                </div>
              )}
              {job.finishedOn && (
                <div>
                  <span className="text-muted-foreground">Finalizado:</span>{' '}
                  {new Date(job.finishedOn).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
            {job.failedReason && (
              <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                <strong>Erro:</strong> {job.failedReason}
              </div>
            )}
            {job.data && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-muted-foreground">Dados do Job</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(job.data, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
