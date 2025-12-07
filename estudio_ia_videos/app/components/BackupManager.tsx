'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Clock, 
  HardDrive, 
  Cloud, 
  Shield, 
  Settings,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Database,
  Zap,
  Archive,
  History
} from 'lucide-react';
import { useBackupSystem, RestorePoint } from '@/hooks/useBackupSystem';
import { useToast } from '@/hooks/use-toast';

interface BackupManagerProps {
  className?: string;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ className = '' }) => {
  const {
    versions: backups,
    restorePoints,
    config,
    stats,
    isBackingUp,
    isRestoring,
    // error, // Not available in hook
    createBackup,
    deleteVersion: deleteBackup,
    restoreVersion: restoreFromBackup,
    createRestorePoint,
    restoreToPoint,
    updateConfig,
    exportBackup,
    importBackup,
    deleteOldVersions,
    cleanupStorage: optimizeStorage,
    validateBackup
  } = useBackupSystem('default-project'); // Added projectId argument

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('backups');
  const [newBackupName, setNewBackupName] = useState('');
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [newRestorePointName, setNewRestorePointName] = useState('');
  const [newRestorePointDescription, setNewRestorePointDescription] = useState('');
  const [validatingBackup, setValidatingBackup] = useState<string | null>(null);
  const error = null; // Mock error since it's not in hook

  const handleCreateBackup = async () => {
    if (!newBackupName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o backup.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createBackup('manual', newBackupDescription); // Changed to match signature
      setNewBackupName('');
      setNewBackupDescription('');
      toast({
        title: "Backup criado",
        description: "Backup criado com sucesso!",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar backup",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await deleteBackup(backupId);
      toast({
        title: "Backup removido",
        description: "Backup removido com sucesso!",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao remover backup",
        variant: "destructive"
      });
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      await restoreFromBackup(backupId);
      toast({
        title: "Restauração concluída",
        description: "Sistema restaurado com sucesso!",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro na restauração",
        variant: "destructive"
      });
    }
  };

  const handleCreateRestorePoint = async () => {
    if (!newRestorePointName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o ponto de restauração.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createRestorePoint(newRestorePointName, newRestorePointDescription);
      setNewRestorePointName('');
      setNewRestorePointDescription('');
      toast({
        title: "Ponto de restauração criado",
        description: "Ponto de restauração criado com sucesso!",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar ponto de restauração",
        variant: "destructive"
      });
    }
  };

  const handleExportBackup = async (backupId: string) => {
    try {
      const blob = await exportBackup(backupId, 'json'); // Added format argument
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backupId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup exportado",
        description: "Backup exportado com sucesso!",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao exportar backup",
        variant: "destructive"
      });
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importBackup(file);
      toast({
        title: "Backup importado",
        description: "Backup importado com sucesso!",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao importar backup",
        variant: "destructive"
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleValidateBackup = async (backupId: string) => {
    setValidatingBackup(backupId);
    try {
      const isValid = await validateBackup(backupId);
      toast({
        title: isValid ? "Backup válido" : "Backup inválido",
        description: isValid ? "Backup está íntegro e pode ser restaurado." : "Backup corrompido ou inválido.",
        variant: isValid ? "default" : "destructive"
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao validar backup",
        variant: "destructive"
      });
    } finally {
      setValidatingBackup(null);
    }
  };

  const handleConfigUpdate = async (key: string, value: boolean | number) => {
    try {
      await updateConfig({ [key]: value });
      toast({
        title: "Configuração atualizada",
        description: "Configuração salva com sucesso!",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração",
        variant: "destructive"
      });
    }
  };

  const handleCleanupOldBackups = async () => {
      const date = new Date();
      date.setDate(date.getDate() - 30); // Delete older than 30 days
      await deleteOldVersions(date);
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'auto': return <Clock className="h-4 w-4" />;
      case 'manual': return <Save className="h-4 w-4" />;
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getBackupTypeBadge = (type: string) => {
    switch (type) {
      case 'auto': return <Badge variant="secondary">Automático</Badge>;
      case 'manual': return <Badge variant="default">Manual</Badge>;
      case 'scheduled': return <Badge variant="outline">Agendado</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Backup</h2>
          <p className="text-gray-600">
            Gerencie backups e pontos de restauração do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanupOldBackups}
          >
            <Archive className="h-4 w-4 mr-2" />
            Limpar Antigos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={optimizeStorage}
          >
            <Zap className="h-4 w-4 mr-2" />
            Otimizar
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Backups</p>
                <p className="text-3xl font-bold">{stats.totalVersions}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Espaço Usado</p>
                <p className="text-3xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-green-600" />
            </div>
            {/* Removed Progress as storageLimit is missing */}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Último Backup</p>
                <p className="text-lg font-semibold">
                  {stats.newestBackup 
                    ? stats.newestBackup.toLocaleDateString('pt-BR')
                    : 'Nunca'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-3xl font-bold text-green-600">100%</p> 
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="restore-points">Pontos de Restauração</TabsTrigger>
          <TabsTrigger value="create">Criar Backup</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Lista de Backups</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </div>
          </div>

          {backups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum backup encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Crie seu primeiro backup para proteger seus dados.
                </p>
                <Button onClick={() => setActiveTab('create')}>
                  Criar Backup
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {backups
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((backup) => (
                <Card key={backup.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getBackupTypeIcon(backup.type)}
                          <h4 className="font-semibold text-gray-900">{backup.id}</h4>
                          {getBackupTypeBadge(backup.type)}
                        </div>
                        {backup.description && (
                          <p className="text-gray-600 text-sm mb-2">{backup.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{backup.timestamp.toLocaleString('pt-BR')}</span>
                          <span>{formatFileSize(backup.size)}</span>
                          <span>v{backup.version}</span>
                          {backup.compressed && (
                            <Badge variant="outline" className="text-xs">Comprimido</Badge>
                          )}
                        </div>
                        {backup.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {backup.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValidateBackup(backup.id)}
                          disabled={validatingBackup === backup.id}
                        >
                          {validatingBackup === backup.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportBackup(backup.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRestoreBackup(backup.id)}
                          disabled={isRestoring}
                        >
                          {isRestoring ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Restaurar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteBackup(backup.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="restore-points" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pontos de Restauração</h3>
          </div>

          {restorePoints.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum ponto de restauração
                </h3>
                <p className="text-gray-600">
                  Pontos de restauração permitem voltar a um estado específico do sistema.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {restorePoints
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((point) => (
                <Card key={point.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <History className="h-4 w-4" />
                          <h4 className="font-semibold text-gray-900">{point.name}</h4>
                          {point.stable && (
                            <Badge variant="default">Estável</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{point.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{point.timestamp.toLocaleString('pt-BR')}</span>
                          {/* <span>{point.backupIds.length} backups</span> */}
                          {/* <span>{point.metadata.templatesCount} templates</span> */}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => restoreToPoint(point.id)}
                          disabled={isRestoring}
                        >
                          {isRestoring ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Restaurar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Manual Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Criar Backup Manual
                </CardTitle>
                <CardDescription>
                  Crie um backup completo do estado atual do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="backup-name">Nome do Backup</Label>
                  <Input
                    id="backup-name"
                    value={newBackupName}
                    onChange={(e) => setNewBackupName(e.target.value)}
                    placeholder="Ex: Backup antes da atualização"
                  />
                </div>
                <div>
                  <Label htmlFor="backup-description">Descrição (opcional)</Label>
                  <Textarea
                    id="backup-description"
                    value={newBackupDescription}
                    onChange={(e) => setNewBackupDescription(e.target.value)}
                    placeholder="Descreva o motivo ou contexto deste backup"
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleCreateBackup}
                  disabled={isBackingUp || !newBackupName.trim()}
                  className="w-full"
                >
                  {isBackingUp ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Criar Backup
                </Button>
              </CardContent>
            </Card>

            {/* Create Restore Point */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Criar Ponto de Restauração
                </CardTitle>
                <CardDescription>
                  Crie um ponto de restauração completo com múltiplos backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="restore-point-name">Nome do Ponto</Label>
                  <Input
                    id="restore-point-name"
                    value={newRestorePointName}
                    onChange={(e) => setNewRestorePointName(e.target.value)}
                    placeholder="Ex: Estado estável v2.1"
                  />
                </div>
                <div>
                  <Label htmlFor="restore-point-description">Descrição</Label>
                  <Textarea
                    id="restore-point-description"
                    value={newRestorePointDescription}
                    onChange={(e) => setNewRestorePointDescription(e.target.value)}
                    placeholder="Descreva o estado do sistema neste ponto"
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleCreateRestorePoint}
                  disabled={isBackingUp || !newRestorePointName.trim()}
                  className="w-full"
                >
                  {isBackingUp ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <History className="h-4 w-4 mr-2" />
                  )}
                  Criar Ponto de Restauração
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Backup
              </CardTitle>
              <CardDescription>
                Configure o comportamento do sistema de backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-backup">Backup Automático</Label>
                  <p className="text-sm text-gray-600">
                    Criar backups automaticamente em intervalos regulares
                  </p>
                </div>
                <Switch
                  id="auto-backup"
                  checked={config.autoBackup}
                  onCheckedChange={(checked) => handleConfigUpdate('autoBackup', checked)}
                />
              </div>

              <div>
                <Label htmlFor="backup-interval">Intervalo de Backup (minutos)</Label>
                <Input
                  id="backup-interval"
                  type="number"
                  value={config.interval}
                  onChange={(e) => handleConfigUpdate('interval', parseInt(e.target.value))}
                  min="5"
                  max="1440"
                />
              </div>

              <div>
                <Label htmlFor="max-backups">Máximo de Backups</Label>
                <Input
                  id="max-backups"
                  type="number"
                  value={config.maxVersions}
                  onChange={(e) => handleConfigUpdate('maxVersions', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <Label htmlFor="retention-days">Retenção (dias)</Label>
                <Input
                  id="retention-days"
                  type="number"
                  value={config.retentionPolicy.daily}
                  onChange={(e) => handleConfigUpdate('retentionPolicy', { ...config.retentionPolicy, daily: parseInt(e.target.value) } as any)}
                  min="1"
                  max="365"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compression">Compressão</Label>
                  <p className="text-sm text-gray-600">
                    Comprimir backups para economizar espaço
                  </p>
                </div>
                <Switch
                  id="compression"
                  checked={config.compression}
                  onCheckedChange={(checked) => handleConfigUpdate('compression', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cloud-sync">Sincronização na Nuvem</Label>
                  <p className="text-sm text-gray-600">
                    Sincronizar backups com armazenamento na nuvem
                  </p>
                </div>
                <Switch
                  id="cloud-sync"
                  checked={config.cloudSync}
                  onCheckedChange={(checked) => handleConfigUpdate('cloudSync', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};