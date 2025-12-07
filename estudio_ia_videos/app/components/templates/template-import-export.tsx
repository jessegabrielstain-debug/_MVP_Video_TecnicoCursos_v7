'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Copy,
  Share2,
  Archive,
  FileJson,
  FileCode,
  Globe
} from 'lucide-react';
import { Template } from '@/types/templates';

/** Dados exportados em diferentes formatos */
type ExportData = string;

/** Resultado de validação de template */
interface ValidationResult {
  index: number;
  template: Template;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface TemplateImportExportProps {
  mode: 'import' | 'export';
  template?: Template;
  onClose: () => void;
  onImport?: (templates: Template[]) => void;
  onExport?: (format: string, data: ExportData) => void;
}

export const TemplateImportExport: React.FC<TemplateImportExportProps> = ({
  mode,
  template,
  onClose,
  onImport,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState(mode === 'import' ? 'file' : 'json');
  const [importData, setImportData] = useState('');
  const [exportFormat, setExportFormat] = useState('json');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportFormats = [
    { id: 'json', name: 'JSON', description: 'Formato padrão do sistema', icon: FileJson },
    { id: 'xml', name: 'XML', description: 'Formato XML estruturado', icon: FileCode },
    { id: 'zip', name: 'ZIP Package', description: 'Pacote completo com assets', icon: Archive },
    { id: 'url', name: 'Share URL', description: 'Link para compartilhamento', icon: Globe },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('processing');
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          handleJsonImport(content);
        } else if (file.name.endsWith('.xml')) {
          handleXmlImport(content);
        } else if (file.name.endsWith('.zip')) {
          handleZipImport(file);
        } else {
          throw new Error('Formato de arquivo não suportado');
        }
      } catch (error) {
        setStatus('error');
        setMessage(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    };

    reader.onerror = () => {
      setStatus('error');
      setMessage('Erro ao ler o arquivo');
    };

    if (file.name.endsWith('.zip')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleJsonImport = (content: string) => {
    try {
      const data = JSON.parse(content);
      const templates = Array.isArray(data) ? data : [data];
      
      // Simular progresso
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 20;
        setProgress(currentProgress);
        
        if (currentProgress >= 100) {
          clearInterval(interval);
          validateTemplates(templates);
        }
      }, 200);
      
    } catch (error) {
      setStatus('error');
      setMessage('JSON inválido');
    }
  };

  const handleXmlImport = (content: string) => {
    // Implementação simplificada para XML
    setStatus('error');
    setMessage('Importação XML ainda não implementada');
  };

  const handleZipImport = (file: File) => {
    // Implementação simplificada para ZIP
    setStatus('error');
    setMessage('Importação ZIP ainda não implementada');
  };

  const validateTemplates = (templates: Partial<Template>[]) => {
    const results = templates.map((template, index) => {
      const errors = [];
      const warnings = [];

      // Validações básicas
      if (!template.name) errors.push('Nome é obrigatório');
      if (!template.category) errors.push('Categoria é obrigatória');
      if (!template.content) errors.push('Conteúdo é obrigatório');
      
      // Validações de conteúdo
      if (template.content && !template.content.slides) {
        warnings.push('Nenhum slide encontrado');
      }

      return {
        index,
        template,
        valid: errors.length === 0,
        errors,
        warnings,
      };
    });

    setValidationResults(results);
    
    const validTemplates = results.filter(r => r.valid).map(r => r.template);
    
    if (validTemplates.length > 0) {
      setStatus('success');
      setMessage(`${validTemplates.length} template(s) importado(s) com sucesso`);
      onImport?.(validTemplates);
    } else {
      setStatus('error');
      setMessage('Nenhum template válido encontrado');
    }
  };

  const handleTextImport = () => {
    if (!importData.trim()) {
      setStatus('error');
      setMessage('Cole o conteúdo do template');
      return;
    }

    handleJsonImport(importData);
  };

  const handleExport = () => {
    if (!template && exportFormat !== 'url') {
      setStatus('error');
      setMessage('Nenhum template selecionado');
      return;
    }

    setStatus('processing');
    setProgress(0);

    // Simular progresso
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 25;
        if (next >= 100) {
          clearInterval(interval);
          completeExport();
        }
        return next;
      });
    }, 300);
  };

  const completeExport = () => {
    let exportData: ExportData = '';
    let filename = '';

    switch (exportFormat) {
      case 'json':
        exportData = JSON.stringify(template, null, 2);
        filename = `${template?.name || 'template'}.json`;
        break;
      case 'xml':
        exportData = convertToXml(template);
        filename = `${template?.name || 'template'}.xml`;
        break;
      case 'zip':
        exportData = createZipPackage(template);
        filename = `${template?.name || 'template'}.zip`;
        break;
      case 'url':
        exportData = generateShareUrl(template);
        filename = 'share-url.txt';
        break;
    }

    if (exportFormat === 'url') {
      navigator.clipboard.writeText(exportData);
      setStatus('success');
      setMessage('URL copiada para a área de transferência');
    } else {
      downloadFile(exportData, filename);
      setStatus('success');
      setMessage('Template exportado com sucesso');
    }

    onExport?.(exportFormat, exportData);
  };

  const convertToXml = (tpl: Template | undefined): string => {
    // Implementação simplificada
    return `<?xml version="1.0" encoding="UTF-8"?>
<template>
  <name>${tpl?.name || ''}</name>
  <description>${tpl?.description || ''}</description>
  <category>${tpl?.category || ''}</category>
</template>`;
  };

  const createZipPackage = (tpl: Template | undefined): string => {
    // Implementação simplificada - retorna JSON por enquanto
    return JSON.stringify({
      template: tpl,
      assets: [],
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    }, null, 2);
  };

  const generateShareUrl = (tpl: Template | undefined): string => {
    const encoded = btoa(JSON.stringify(tpl));
    return `${window.location.origin}/templates/shared?data=${encoded}`;
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage('Copiado para a área de transferência');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'import' ? (
              <>
                <Upload className="w-5 h-5" />
                Importar Templates
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Exportar Template
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {mode === 'import' ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Arquivo</TabsTrigger>
              <TabsTrigger value="text">Texto</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Upload de Arquivo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Arraste um arquivo ou clique para selecionar</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Formatos suportados: JSON, XML, ZIP
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Selecionar Arquivo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.xml,.zip"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Importar via Texto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="import-data">Cole o JSON do template:</Label>
                    <Textarea
                      id="import-data"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Cole aqui o conteúdo JSON do template..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button onClick={handleTextImport} className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Template
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="xml">XML</TabsTrigger>
              <TabsTrigger value="zip">ZIP</TabsTrigger>
              <TabsTrigger value="share">Compartilhar</TabsTrigger>
            </TabsList>

            {exportFormats.map((format) => (
              <TabsContent key={format.id} value={format.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <format.icon className="w-5 h-5" />
                      Exportar como {format.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{format.description}</p>
                    
                    {template && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Template Selecionado:</h4>
                        <div className="text-sm space-y-1">
                          <div><span className="font-medium">Nome:</span> {template.name}</div>
                          <div><span className="font-medium">Categoria:</span> {template.category}</div>
                          <div><span className="font-medium">Slides:</span> {template.content.slides.length}</div>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={() => {
                        setExportFormat(format.id);
                        handleExport();
                      }}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar {format.name}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Progress and Status */}
        {status === 'processing' && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processando...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Messages */}
        {message && (
          <Alert className={status === 'error' ? 'border-red-200 bg-red-50' : status === 'success' ? 'border-green-200 bg-green-50' : ''}>
            {status === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : null}
            <AlertDescription className={status === 'error' ? 'text-red-800' : status === 'success' ? 'text-green-800' : ''}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Results */}
        {validationResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultados da Validação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        Template {index + 1}: {result.template.name || 'Sem nome'}
                      </span>
                      <Badge variant={result.valid ? 'default' : 'destructive'}>
                        {result.valid ? 'Válido' : 'Inválido'}
                      </Badge>
                    </div>
                    
                    {result.errors.length > 0 && (
                      <div className="text-sm text-red-600 space-y-1">
                        <div className="font-medium">Erros:</div>
                        {result.errors.map((error: string, i: number) => (
                          <div key={i} className="ml-2">• {error}</div>
                        ))}
                      </div>
                    )}
                    
                    {result.warnings.length > 0 && (
                      <div className="text-sm text-yellow-600 space-y-1 mt-2">
                        <div className="font-medium">Avisos:</div>
                        {result.warnings.map((warning: string, i: number) => (
                          <div key={i} className="ml-2">• {warning}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};