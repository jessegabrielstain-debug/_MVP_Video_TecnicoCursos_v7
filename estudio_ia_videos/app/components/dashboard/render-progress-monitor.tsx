'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useRenderPipeline } from '../../hooks/use-render-pipeline';

export function RenderProgressMonitor() {
  const { renderQueue } = useRenderPipeline();
  
  const activeJob = renderQueue?.processing?.[0];
  const isRendering = !!activeJob;
  
  const progress = activeJob ? {
    jobId: activeJob.id,
    progress: activeJob.progress,
    status: activeJob.status
  } : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Monitor de Renderização
        </CardTitle>
        <CardDescription>
          Acompanhe o progresso das renderizações em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-4">
            {isRendering && progress ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                    <span className="font-medium">Job: {progress.jobId}</span>
                  </div>
                  <Badge variant="default">Em Progresso</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Status: {progress.status}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Tempo estimado restante: {Math.round((100 - progress.progress) / 10)} min</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma renderização ativa</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Todas as tarefas foram concluídas
                </p>
              </div>
            )}
            
            {/* Mock completed jobs for demonstration */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Trabalhos Recentes</h4>
              
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Projeto {i}</p>
                      <p className="text-xs text-muted-foreground">
                        Concluído há {i * 5} minutos
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Concluído</Badge>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}