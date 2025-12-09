'use client';

import React, { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Database, HardDrive, Server, Activity, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CacheStats {
  stats: {
    hits: number;
    misses: number;
    hitRate: number;
    totalEntries: number;
    memoryUsage: number;
  };
  layers: {
    memory: { enabled: boolean; entries: number; usage: number };
    redis: { enabled: boolean; status: string };
    file: { enabled: boolean; status: string };
  };
  performance: {
    hitRate: number;
    avgResponseTime: number;
    throughput: number;
  };
}

interface CacheDashboardProps {
  refreshInterval?: number;
}

export default function CacheDashboard({ refreshInterval = 5000 }: CacheDashboardProps) {
  const [data, setData] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cache/intelligent?action=stats');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        toast.error('Erro ao carregar dados do cache');
      }
    } catch (error) {
      logger.error('Failed to fetch cache stats', error instanceof Error ? error : new Error(String(error)), { component: 'CacheDashboard' });
      toast.error('Falha na conexão com API de cache');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o cache? Isso pode afetar a performance temporariamente.')) return;
    
    try {
      const response = await fetch('/api/cache/intelligent?action=clear', { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        toast.success('Cache limpo com sucesso');
        fetchData();
      } else {
        toast.error('Erro ao limpar cache');
      }
    } catch (error) {
      toast.error('Falha ao limpar cache');
    }
  };

  useEffect(() => {
    fetchData();
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  if (!data) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cache Inteligente</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do sistema de cache multi-camada
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="destructive" onClick={clearCache}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Cache
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto (Hit Rate)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.stats.hitRate * 100).toFixed(1)}%</div>
            <Progress value={data.stats.hitRate * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {data.stats.hits} hits / {data.stats.misses} misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de Memória</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(data.stats.memoryUsage)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.stats.totalEntries} itens em memória
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.throughput} ops/s</div>
            <p className="text-xs text-muted-foreground mt-2">
              Tempo médio: {data.performance.avgResponseTime}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mt-1">
              <Badge variant={data.layers.memory.enabled ? "default" : "secondary"}>Memória</Badge>
              <Badge variant={data.layers.redis.status === 'connected' ? "default" : "destructive"}>Redis</Badge>
              <Badge variant={data.layers.file.status === 'available' ? "default" : "outline"}>Disco</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Última atualização: {lastUpdated?.toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="layers">Camadas</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho Recente</CardTitle>
              <CardDescription>Métricas de performance do sistema de cache nos últimos minutos.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Gráfico de hits/misses em tempo real (placeholder)
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="layers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" /> Memória (L1)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge>Ativo</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Itens:</span>
                    <span>{data.layers.memory.entries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Uso:</span>
                    <span>{formatBytes(data.layers.memory.usage)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" /> Redis (L2)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={data.layers.redis.status === 'connected' ? 'default' : 'destructive'}>
                      {data.layers.redis.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Latência:</span>
                    <span>~5ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" /> Disco (L3)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline">{data.layers.file.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Caminho:</span>
                    <span className="text-xs font-mono">/tmp/cache</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Globais</CardTitle>
              <CardDescription>Parâmetros atuais do sistema de cache.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">TTL Padrão</label>
                    <div className="p-2 bg-muted rounded-md">3600 segundos</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estratégia de Evicção</label>
                    <div className="p-2 bg-muted rounded-md">LRU (Least Recently Used)</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Compressão</label>
                    <div className="p-2 bg-muted rounded-md">Ativada (Gzip)</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prefetching</label>
                    <div className="p-2 bg-muted rounded-md">Inteligente (Baseado em acesso)</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Zona de Perigo
                  </h4>
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10">
                    Resetar Configurações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
