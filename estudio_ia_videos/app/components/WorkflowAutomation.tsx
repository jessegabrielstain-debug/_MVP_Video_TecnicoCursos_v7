'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Settings, 
  Activity, 
  Clock, 
  Zap, 
  Globe, 
  Calendar, 
  Code, 
  Mail, 
  Bell, 
  Database, 
  FileText, 
  Brain, 
  Terminal,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { useWorkflowAutomation, Workflow, WorkflowExecution, WorkflowTrigger, WorkflowAction } from '@/hooks/useWorkflowAutomation';

export const WorkflowAutomation: React.FC = () => {
  const {
    workflows,
    executions,
    templates,
    isLoading,
    error,
    stats,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    triggerWorkflow,
    stopWorkflow
  } = useWorkflowAutomation();

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filter workflows
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && workflow.isActive) ||
                         (filterStatus === 'inactive' && !workflow.isActive);
    const matchesCategory = filterCategory === 'all' || workflow.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(workflows.map(w => w.category)));

  const handleTriggerWorkflow = useCallback(async (workflowId: string) => {
    try {
      await triggerWorkflow(workflowId);
    } catch (err) {
      console.error('Failed to trigger workflow:', err);
    }
  }, [triggerWorkflow]);

  const handleDeleteWorkflow = useCallback(async (workflowId: string) => {
    if (confirm('Tem certeza que deseja excluir este workflow?')) {
      await deleteWorkflow(workflowId);
    }
  }, [deleteWorkflow]);

  const handleToggleWorkflow = useCallback(async (workflowId: string, isActive: boolean) => {
    await updateWorkflow(workflowId, { isActive });
  }, [updateWorkflow]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando workflows...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>Erro: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automação de Workflows</h2>
          <p className="text-muted-foreground">
            Gerencie e automatize processos com triggers e ações personalizadas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Workflow
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Workflows</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeWorkflows} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Execuções</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExecutions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.successfulExecutions} bem-sucedidas
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
                {stats.totalExecutions > 0 
                  ? Math.round((stats.successfulExecutions / stats.totalExecutions) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.errorRate.toFixed(1)}% de erro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.averageExecutionTime / 1000)}s
              </div>
              <p className="text-xs text-muted-foreground">
                Por execução
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Execuções</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(value: string) => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Workflows List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onTrigger={handleTriggerWorkflow}
                onEdit={(workflow) => {
                  setSelectedWorkflow(workflow);
                  setIsEditDialogOpen(true);
                }}
                onDelete={handleDeleteWorkflow}
                onToggle={handleToggleWorkflow}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <ExecutionsList 
            executions={executions}
            workflows={workflows}
            onSelectExecution={setSelectedExecution}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplatesList templates={templates} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard stats={stats} />
        </TabsContent>
      </Tabs>

      {/* Create Workflow Dialog */}
      <CreateWorkflowDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={createWorkflow}
      />

      {/* Edit Workflow Dialog */}
      {selectedWorkflow && (
        <EditWorkflowDialog
          workflow={selectedWorkflow}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedWorkflow(null);
          }}
          onUpdate={updateWorkflow}
        />
      )}

      {/* Execution Details Dialog */}
      {selectedExecution && (
        <ExecutionDetailsDialog
          execution={selectedExecution}
          workflow={workflows.find(w => w.id === selectedExecution.workflowId)}
          isOpen={!!selectedExecution}
          onClose={() => setSelectedExecution(null)}
        />
      )}
    </div>
  );
};

// Workflow Card Component
const WorkflowCard: React.FC<{
  workflow: Workflow;
  onTrigger: (id: string) => void;
  onEdit: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}> = ({ workflow, onTrigger, onEdit, onDelete, onToggle }) => {
  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'schedule': return <Clock className="h-4 w-4" />;
      case 'webhook': return <Globe className="h-4 w-4" />;
      case 'event': return <Zap className="h-4 w-4" />;
      case 'manual': return <Play className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'api_call': return <Globe className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      case 'data_transform': return <Database className="h-4 w-4" />;
      case 'file_operation': return <FileText className="h-4 w-4" />;
      case 'ai_process': return <Brain className="h-4 w-4" />;
      case 'custom_script': return <Terminal className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${workflow.isActive ? 'border-green-200' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">{workflow.name}</CardTitle>
            <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
              {workflow.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <Switch
            checked={workflow.isActive}
            onCheckedChange={(checked) => onToggle(workflow.id, checked)}
          />
        </div>
        {workflow.description && (
          <CardDescription className="text-sm">{workflow.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Triggers */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground">TRIGGERS</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {workflow.triggers.map((trigger) => (
              <Badge key={trigger.id} variant="outline" className="text-xs">
                {getTriggerIcon(trigger.type)}
                <span className="ml-1">{trigger.name}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground">AÇÕES</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {workflow.actions.slice(0, 3).map((action) => (
              <Badge key={action.id} variant="outline" className="text-xs">
                {getActionIcon(action.type)}
                <span className="ml-1">{action.name}</span>
              </Badge>
            ))}
            {workflow.actions.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{workflow.actions.length - 3} mais
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Execuções</Label>
            <div className="font-medium">{workflow.executionCount}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Taxa de Sucesso</Label>
            <div className="font-medium">{Math.round(workflow.successRate * 100)}%</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTrigger(workflow.id)}
              disabled={!workflow.isActive}
            >
              <Play className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(workflow)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(workflow.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Badge variant="secondary" className="text-xs">
            {workflow.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Executions List Component
const ExecutionsList: React.FC<{
  executions: WorkflowExecution[];
  workflows: Workflow[];
  onSelectExecution: (execution: WorkflowExecution) => void;
}> = ({ executions, workflows, onSelectExecution }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'cancelled': return <Square className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Execuções Recentes</h3>
        <Badge variant="secondary">{executions.length} execuções</Badge>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {executions.map((execution) => {
            const workflow = workflows.find(w => w.id === execution.workflowId);
            return (
              <Card 
                key={execution.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectExecution(execution)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(execution.status)}
                      <div>
                        <div className="font-medium">{workflow?.name || 'Workflow Desconhecido'}</div>
                        <div className="text-sm text-muted-foreground">
                          {execution.startTime.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                      {execution.duration && (
                        <Badge variant="outline">
                          {Math.round(execution.duration / 1000)}s
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                      {execution.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

// Templates List Component
const TemplatesList: React.FC<{
  templates: any[];
}> = ({ templates }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Templates de Workflow</h3>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Importar Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{template.category}</Badge>
                <div className="flex items-center space-x-1">
                  <Button size="sm" variant="outline">
                    <Copy className="h-3 w-3 mr-1" />
                    Usar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Analytics Dashboard Component
const AnalyticsDashboard: React.FC<{
  stats: any;
}> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Analytics de Workflows</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Workflows */}
        <Card>
          <CardHeader>
            <CardTitle>Workflows Mais Utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.mostUsedWorkflows.map((workflow: any, index: number) => (
                <div key={workflow.workflowId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium">{workflow.name}</span>
                  </div>
                  <Badge>{workflow.count} execuções</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de Sucesso</span>
                  <span>{Math.round((stats.successfulExecutions / stats.totalExecutions) * 100)}%</span>
                </div>
                <Progress 
                  value={(stats.successfulExecutions / stats.totalExecutions) * 100} 
                  className="mt-1"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de Erro</span>
                  <span>{stats.errorRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={stats.errorRate} 
                  className="mt-1"
                />
              </div>
              
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">Tempo Médio de Execução</div>
                <div className="text-2xl font-bold">{Math.round(stats.averageExecutionTime / 1000)}s</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Create Workflow Dialog Component
const CreateWorkflowDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (workflow: any) => Promise<any>;
}> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const workflow = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      triggers: [],
      actions: [],
      variables: [],
      version: '1.0.0',
      createdBy: 'current-user'
    };

    await onCreate(workflow);
    onClose();
    setFormData({
      name: '',
      description: '',
      category: '',
      tags: '',
      isActive: true
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Workflow</DialogTitle>
          <DialogDescription>
            Configure as informações básicas do seu workflow
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="automação, email, notificação"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Ativar workflow</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Workflow
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Workflow Dialog Component
const EditWorkflowDialog: React.FC<{
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => Promise<any>;
}> = ({ workflow, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: workflow.name,
    description: workflow.description || '',
    category: workflow.category,
    tags: workflow.tags.join(', '),
    isActive: workflow.isActive
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    await onUpdate(workflow.id, updates);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Workflow</DialogTitle>
          <DialogDescription>
            Atualize as informações do workflow
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="automação, email, notificação"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Ativar workflow</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Execution Details Dialog Component
const ExecutionDetailsDialog: React.FC<{
  execution: WorkflowExecution;
  workflow?: Workflow;
  isOpen: boolean;
  onClose: () => void;
}> = ({ execution, workflow, isOpen, onClose }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'cancelled': return <Square className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getStatusIcon(execution.status)}
            <span>Detalhes da Execução</span>
          </DialogTitle>
          <DialogDescription>
            {workflow?.name || 'Workflow Desconhecido'} - {execution.startTime.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Execution Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusIcon(execution.status)}
                <span className="capitalize">{execution.status}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Duração</Label>
              <div className="mt-1">
                {execution.duration ? `${Math.round(execution.duration / 1000)}s` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Error */}
          {execution.error && (
            <div>
              <Label className="text-sm font-medium text-red-600">Erro</Label>
              <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {execution.error}
              </div>
            </div>
          )}

          {/* Action Results */}
          <div>
            <Label className="text-sm font-medium">Resultados das Ações</Label>
            <div className="mt-2 space-y-2">
              {execution.actionResults.map((result, index) => (
                <Card key={result.actionId} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">Ação {index + 1}</span>
                    </div>
                    <Badge variant="outline">
                      {result.duration ? `${Math.round(result.duration / 1000)}s` : 'N/A'}
                    </Badge>
                  </div>
                  {result.error && (
                    <div className="mt-2 text-sm text-red-600">{result.error}</div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Variables */}
          {Object.keys(execution.variables).length > 0 && (
            <div>
              <Label className="text-sm font-medium">Variáveis</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(execution.variables, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Logs */}
          {execution.logs.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Logs</Label>
              <ScrollArea className="h-32 mt-2">
                <div className="space-y-1">
                  {execution.logs.map((log) => (
                    <div key={log.id} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          log.level === 'error' ? 'text-red-600' :
                          log.level === 'warn' ? 'text-yellow-600' :
                          log.level === 'info' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1">{log.message}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowAutomation;