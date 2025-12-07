
/**
 * ⚙️ Estúdio IA de Vídeos - Sprint 8
 * Workflow Studio - Interface de Automação
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Workflow as WorkflowIcon,
  Play,
  Square,
  RotateCcw,
  Settings,
  Download,
  Upload,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Loader,
  BarChart3,
  Zap,
  FileText,
  Mic,
  Video,
  Shield,
  Send,
  Eye,
  Copy,
  Trash2,
  Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  timeout: number;
  optional?: boolean;
}

interface WorkflowMetadata {
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;
  tags: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  metadata: WorkflowMetadata;
}

interface ExecutionStep {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

interface Execution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: string;
  endTime?: string;
  currentStep?: string;
  steps: ExecutionStep[];
}

interface Stats {
  total: number;
  successRate: number;
  running: number;
  averageDuration: number;
}

export default function WorkflowStudio() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadWorkflows();
    loadExecutions();
    loadStats();
    
    // Atualiza execuções a cada 3 segundos
    const interval = setInterval(() => {
      loadExecutions();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/automation/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      toast.error('Erro ao carregar workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch('/api/automation/executions');
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar execuções:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/automation/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const executeWorkflow = async (workflowId: string, inputs = {}) => {
    try {
      const response = await fetch('/api/automation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, inputs })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Workflow iniciado: ${result.executionId}`);
        loadExecutions();
      } else {
        throw new Error('Falha na execução');
      }
    } catch (error) {
      toast.error('Erro ao executar workflow: ' + (error as Error).message);
    }
  };

  const cancelExecution = async (executionId: string) => {
    try {
      const response = await fetch(`/api/automation/executions/${executionId}/cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Execução cancelada');
        loadExecutions();
      }
    } catch (error) {
      toast.error('Erro ao cancelar execução');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <Loader className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'cancelled': return <Square className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'pptx_upload': return <Upload className="h-4 w-4" />;
      case 'ai_generation': return <Zap className="h-4 w-4" />;
      case 'tts_synthesis': return <Mic className="h-4 w-4" />;
      case 'video_render': return <Video className="h-4 w-4" />;
      case 'quality_check': return <Shield className="h-4 w-4" />;
      case 'distribution': return <Send className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando Workflow Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <WorkflowIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Workflow Studio</h1>
                  <p className="text-gray-600">Automação avançada de produção de vídeos</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Novo Workflow
              </Button>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Execuções</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Em Execução</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
                  </div>
                  <Loader className="h-8 w-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tempo Médio</p>
                    <p className="text-2xl font-bold">{formatDuration(stats.averageDuration)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </Card>
            </div>
          )}
        </div>

        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="executions">Execuções</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          </TabsList>

          {/* Tab: Workflows */}
          <TabsContent value="workflows" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{workflow.name}</span>
                      <Badge variant={workflow.metadata.priority === 'high' ? 'default' : 'secondary'}>
                        {workflow.metadata.priority}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">{workflow.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Steps:</span>
                        <span className="font-medium">{workflow.steps.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Duração:</span>
                        <span className="font-medium">
                          {formatDuration(workflow.metadata.estimatedDuration)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {workflow.metadata.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => executeWorkflow(workflow.id)}
                          className="flex-1"
                          size="sm"
                        >
                          <Play className="h-3 w-3 mr-2" />
                          Executar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Execuções */}
          <TabsContent value="executions" className="space-y-6">
            <div className="space-y-4">
              {executions.map((execution) => (
                <Card key={execution.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(execution.status)}
                        <div>
                          <h4 className="font-semibold">
                            {workflows.find(w => w.id === execution.workflowId)?.name || 'Workflow'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            ID: {execution.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                          {execution.status}
                        </Badge>
                        {execution.status === 'running' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => cancelExecution(execution.id)}
                          >
                            <Square className="h-3 w-3 mr-2" />
                            Cancelar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExecution(execution)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso</span>
                        <span>{execution.progress}%</span>
                      </div>
                      <Progress value={execution.progress} className="h-2" />

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Início:</span>
                          <p className="font-medium">
                            {new Date(execution.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Step Atual:</span>
                          <p className="font-medium">{execution.currentStep || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Duração:</span>
                          <p className="font-medium">
                            {execution.endTime 
                              ? formatDuration(Math.floor((new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 1000))
                              : formatDuration(Math.floor((Date.now() - new Date(execution.startTime).getTime()) / 1000))
                            }
                          </p>
                        </div>
                      </div>

                      {/* Steps */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {execution.steps.map((step, index) => (
                          <div
                            key={step.stepId}
                            className={`p-2 rounded border text-center text-xs ${
                              step.status === 'completed' ? 'bg-green-50 border-green-200' :
                              step.status === 'running' ? 'bg-blue-50 border-blue-200' :
                              step.status === 'failed' ? 'bg-red-50 border-red-200' :
                              'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {getStatusIcon(step.status)}
                            <p className="mt-1 truncate">{step.stepId}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {executions.length === 0 && (
                <Card className="py-12">
                  <div className="text-center">
                    <WorkflowIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Nenhuma Execução Encontrada
                    </h3>
                    <p className="text-gray-500">
                      Execute um workflow para ver o progresso aqui
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab: Monitoramento */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monitoramento em Tempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Execuções Ativas */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <Loader className="h-4 w-4 mr-2 text-blue-600" />
                      Execuções Ativas ({executions.filter(e => e.status === 'running').length})
                    </h4>
                    <div className="space-y-3">
                      {executions
                        .filter(e => e.status === 'running')
                        .map(execution => (
                          <div key={execution.id} className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{execution.id}</span>
                              <span className="text-xs text-blue-600">{execution.progress}%</span>
                            </div>
                            <Progress value={execution.progress} className="h-1" />
                          </div>
                        ))}
                      
                      {executions.filter(e => e.status === 'running').length === 0 && (
                        <p className="text-sm text-gray-500">Nenhuma execução ativa</p>
                      )}
                    </div>
                  </div>

                  {/* Últimas Execuções */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-600" />
                      Últimas Execuções
                    </h4>
                    <div className="space-y-3">
                      {executions
                        .slice(0, 5)
                        .map(execution => (
                          <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(execution.status)}
                              <div>
                                <p className="font-medium text-sm">{execution.id}</p>
                                <p className="text-xs text-gray-600">
                                  {new Date(execution.startTime).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                              {execution.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Detalhes do Workflow */}
        {selectedWorkflow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedWorkflow.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWorkflow(null)}
                  >
                    ×
                  </Button>
                </CardTitle>
                <p className="text-gray-600">{selectedWorkflow.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Steps do Workflow */}
                  <div>
                    <h4 className="font-semibold mb-4">Steps do Workflow</h4>
                    <div className="space-y-3">
                      {selectedWorkflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                            {getStepIcon(step.type)}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">{step.name}</h5>
                            <p className="text-sm text-gray-600">
                              Tipo: {step.type} | Timeout: {step.timeout}s
                              {step.optional && ' | Opcional'}
                            </p>
                          </div>
                          <Badge variant="outline">
                            Step {index + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => {
                        executeWorkflow(selectedWorkflow.id);
                        setSelectedWorkflow(null);
                      }}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Executar Workflow
                    </Button>
                    <Button variant="outline">
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
