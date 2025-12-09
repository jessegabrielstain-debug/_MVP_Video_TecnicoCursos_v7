'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Download, 
  FileText, 
  Database, 
  Calendar, 
  Filter, 
  History, 
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileJson,
  FileImage,
  FileX
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf' | 'xml';
export type ExportDataType = 'events' | 'performance' | 'users' | 'projects' | 'alerts' | 'reports' | 'all';

interface ExportOptions {
  format: ExportFormat;
  dataType: ExportDataType;
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    organizationId?: string;
    userId?: string;
    category?: string;
    status?: string;
    severity?: string;
  };
  includeMetadata: boolean;
  compression: boolean;
  maxRecords: number;
}

interface ExportHistory {
  id: string;
  filename: string;
  dataType: string;
  format: string;
  recordCount: number;
  fileSize: number;
  processingTime: number;
  createdAt: string;
  status: string;
}

const formatIcons = {
  csv: FileSpreadsheet,
  json: FileJson,
  xlsx: FileSpreadsheet,
  pdf: FileImage,
  xml: FileX
};

const dataTypeLabels = {
  events: 'Eventos',
  performance: 'Performance',
  users: 'Usuários',
  projects: 'Projetos',
  alerts: 'Alertas',
  reports: 'Relatórios',
  all: 'Todos os Dados'
};

export default function DataExportComponent() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    dataType: 'events',
    dateRange: {
      start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    filters: {},
    includeMetadata: false,
    compression: false,
    maxRecords: 10000
  });

  // Carregar histórico de exportações
  useEffect(() => {
    loadExportHistory();
  }, []);

  const loadExportHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'PUT'
      });
      
      if (response.ok) {
        const data = await response.json();
        setExportHistory(data.exports || []);
      }
    } catch (error) {
      logger.error('Error loading export history:', error instanceof Error ? error : new Error(String(error)), { component: 'DataExport' });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Primeiro, criar a exportação
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportOptions)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Falha na exportação');
      }

      const result = await response.json();
      
      // Agora fazer download do arquivo
      const downloadResponse = await fetch(
        `/api/analytics/export?format=${exportOptions.format}&type=${exportOptions.dataType}&start=${exportOptions.dateRange.start}&end=${exportOptions.dateRange.end}&includeMetadata=${exportOptions.includeMetadata}&maxRecords=${exportOptions.maxRecords}`
      );

      if (!downloadResponse.ok) {
        throw new Error('Falha no download do arquivo');
      }

      // Criar blob e fazer download
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.export.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exportação concluída! ${result.export.recordCount} registros exportados.`);
      
      // Recarregar histórico
      loadExportHistory();

    } catch (error: any) {
      logger.error('Export error:', error instanceof Error ? error : new Error(String(error)), { component: 'DataExport' });
      toast.error(`Erro na exportação: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = async (format: ExportFormat, dataType: ExportDataType) => {
    const quickOptions = {
      ...exportOptions,
      format,
      dataType
    };
    
    setExportOptions(quickOptions);
    
    // Pequeno delay para atualizar o estado
    setTimeout(() => {
      handleExport();
    }, 100);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormatIcon = (format: string) => {
    const Icon = formatIcons[format as ExportFormat] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Exportação Rápida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportação Rápida
          </CardTitle>
          <CardDescription>
            Exporte dados rapidamente nos formatos mais comuns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => handleQuickExport('csv', 'events')}
              disabled={isExporting}
              className="h-20 flex-col gap-2"
            >
              {getFormatIcon('csv')}
              <span>Eventos CSV</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickExport('json', 'performance')}
              disabled={isExporting}
              className="h-20 flex-col gap-2"
            >
              {getFormatIcon('json')}
              <span>Performance JSON</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickExport('xlsx', 'users')}
              disabled={isExporting}
              className="h-20 flex-col gap-2"
            >
              {getFormatIcon('xlsx')}
              <span>Usuários Excel</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickExport('pdf', 'all')}
              disabled={isExporting}
              className="h-20 flex-col gap-2"
            >
              {getFormatIcon('pdf')}
              <span>Relatório PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exportação Personalizada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Exportação Personalizada
          </CardTitle>
          <CardDescription>
            Configure opções avançadas para sua exportação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configurações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: ExportFormat) =>
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataType">Tipo de Dados</Label>
              <Select
                value={exportOptions.dataType}
                onValueChange={(value: ExportDataType) =>
                  setExportOptions(prev => ({ ...prev, dataType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="events">Eventos</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="users">Usuários</SelectItem>
                  <SelectItem value="projects">Projetos</SelectItem>
                  <SelectItem value="alerts">Alertas</SelectItem>
                  <SelectItem value="reports">Relatórios</SelectItem>
                  <SelectItem value="all">Todos os Dados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRecords">Máx. Registros</Label>
              <Select
                value={exportOptions.maxRecords.toString()}
                onValueChange={(value) =>
                  setExportOptions(prev => ({ ...prev, maxRecords: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1.000</SelectItem>
                  <SelectItem value="5000">5.000</SelectItem>
                  <SelectItem value="10000">10.000</SelectItem>
                  <SelectItem value="25000">25.000</SelectItem>
                  <SelectItem value="50000">50.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm text-muted-foreground">
                  Data Inicial
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={exportOptions.dateRange.start}
                  onChange={(e) =>
                    setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm text-muted-foreground">
                  Data Final
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={exportOptions.dateRange.end}
                  onChange={(e) =>
                    setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Opções Avançadas */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-0 h-auto font-normal"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Ocultar' : 'Mostrar'} Opções Avançadas
            </Button>

            {showAdvanced && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria (Filtro)</Label>
                    <Input
                      id="category"
                      placeholder="ex: api, user_action"
                      value={exportOptions.filters.category || ''}
                      onChange={(e) =>
                        setExportOptions(prev => ({
                          ...prev,
                          filters: { ...prev.filters, category: e.target.value }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status (Filtro)</Label>
                    <Select
                      value={exportOptions.filters.status || ''}
                      onValueChange={(value) =>
                        setExportOptions(prev => ({
                          ...prev,
                          filters: { ...prev.filters, status: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="success">Sucesso</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                        <SelectItem value="warning">Aviso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeMetadata"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) =>
                        setExportOptions(prev => ({ ...prev, includeMetadata: !!checked }))
                      }
                    />
                    <Label htmlFor="includeMetadata" className="text-sm">
                      Incluir Metadados
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compression"
                      checked={exportOptions.compression}
                      onCheckedChange={(checked) =>
                        setExportOptions(prev => ({ ...prev, compression: !!checked }))
                      }
                    />
                    <Label htmlFor="compression" className="text-sm">
                      Compressão
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão de Exportação */}
          <div className="flex justify-end">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="min-w-[150px]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Dados
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Exportações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Exportações
          </CardTitle>
          <CardDescription>
            Suas exportações recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando histórico...</span>
            </div>
          ) : exportHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma exportação encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exportHistory.map((export_item) => (
                <div
                  key={export_item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getFormatIcon(export_item.format)}
                    <div>
                      <div className="font-medium">{export_item.filename}</div>
                      <div className="text-sm text-muted-foreground">
                        {dataTypeLabels[export_item.dataType as ExportDataType]} • {' '}
                        {format(new Date(export_item.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {export_item.recordCount.toLocaleString()} registros
                      </div>
                      <div className="text-muted-foreground">
                        {formatFileSize(export_item.fileSize)} • {export_item.processingTime}ms
                      </div>
                    </div>

                    <Badge variant={export_item.status === 'success' ? 'default' : 'destructive'}>
                      {export_item.status === 'success' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {export_item.status === 'success' ? 'Sucesso' : 'Erro'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}