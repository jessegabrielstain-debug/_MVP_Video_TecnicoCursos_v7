'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplianceWidget } from './compliance-widget';
import { useComplianceRealtime } from '@/hooks/use-compliance-realtime';
import { 
  FileText, 
  Save, 
  Eye, 
  Settings, 
  Zap,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Target
} from 'lucide-react';

interface ComplianceEditorIntegrationProps {
  projectId: string;
  initialContent?: string;
  initialNrType?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string, nrType: string) => void;
  className?: string;
}

const NR_OPTIONS = [
  { value: 'NR-06', label: 'NR-06 - Equipamento de Proteção Individual' },
  { value: 'NR-10', label: 'NR-10 - Segurança em Instalações e Serviços em Eletricidade' },
  { value: 'NR-11', label: 'NR-11 - Transporte, Movimentação, Armazenagem e Manuseio de Materiais' },
  { value: 'NR-12', label: 'NR-12 - Segurança no Trabalho em Máquinas e Equipamentos' },
  { value: 'NR-18', label: 'NR-18 - Condições e Meio Ambiente de Trabalho na Indústria da Construção' },
  { value: 'NR-20', label: 'NR-20 - Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis' },
  { value: 'NR-23', label: 'NR-23 - Proteção Contra Incêndios' },
  { value: 'NR-33', label: 'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados' },
  { value: 'NR-35', label: 'NR-35 - Trabalho em Altura' }
];

export function ComplianceEditorIntegration({
  projectId,
  initialContent = '',
  initialNrType = 'NR-12',
  onContentChange,
  onSave,
  className = ''
}: ComplianceEditorIntegrationProps) {
  const [content, setContent] = useState(initialContent);
  const [nrType, setNrType] = useState(initialNrType);
  const [activeTab, setActiveTab] = useState('editor');
  const [autoValidate, setAutoValidate] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const {
    isValidating,
    lastValidation,
    triggerValidation,
    triggerFullValidation,
    getComplianceStatus,
    getTopSuggestions,
    needsImmediateAttention,
    score,
    suggestions,
    missingTopics,
    criticalPoints
  } = useComplianceRealtime({
    projectId,
    nrType,
    autoValidate
  });

  // Trigger validation when content changes (debounced)
  useEffect(() => {
    if (autoValidate && content.trim()) {
      const timer = setTimeout(() => {
        triggerValidation(content);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content, autoValidate, triggerValidation]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
  }, [onContentChange]);

  const handleSave = useCallback(async () => {
    try {
      await onSave?.(content, nrType);
      setLastSaved(new Date());
      // Trigger full validation after save
      triggerFullValidation();
    } catch (error) {
      logger.error('Error saving content', error instanceof Error ? error : new Error(String(error)), { component: 'ComplianceEditorIntegration' });
    }
  }, [content, nrType, onSave, triggerFullValidation]);

  const applySuggestion = useCallback((suggestion: string) => {
    // Simple implementation - append suggestion as comment
    const newContent = content + '\n\n// Sugestão de compliance: ' + suggestion;
    handleContentChange(newContent);
  }, [content, handleContentChange]);

  const getComplianceIndicator = () => {
    if (isValidating) {
      return <Badge variant="outline">Validando...</Badge>;
    }
    
    if (!lastValidation) {
      return <Badge variant="outline">Não validado</Badge>;
    }

    const status = getComplianceStatus();
    const variant = status === 'excellent' || status === 'good' ? 'default' :
                   status === 'fair' ? 'secondary' : 'destructive';
    
    return <Badge variant={variant}>{score}% - {status}</Badge>;
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Editor de Conteúdo NR</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {getComplianceIndicator()}
              {needsImmediateAttention() && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Atenção
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={nrType} onValueChange={setNrType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a NR" />
                </SelectTrigger>
                <SelectContent>
                  {NR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoValidate(!autoValidate)}
            >
              <Zap className={`h-4 w-4 mr-1 ${autoValidate ? 'text-green-500' : 'text-gray-400'}`} />
              Auto-validação
            </Button>
            <Button onClick={handleSave} disabled={!content.trim()}>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </div>

          {lastSaved && (
            <p className="text-xs text-muted-foreground">
              Último salvamento: {lastSaved.toLocaleString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">
                <FileText className="h-4 w-4 mr-1" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-1" />
                Visualização
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <Textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder={`Digite o conteúdo para ${nrType}...`}
                    className="min-h-[400px] resize-none"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="prose prose-sm max-w-none">
                    {content ? (
                      <pre className="whitespace-pre-wrap text-sm">
                        {content}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground">
                        Nenhum conteúdo para visualizar
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Compliance Panel */}
        <div className="space-y-4">
          {/* Compliance Widget */}
          <ComplianceWidget
            projectId={projectId}
            nrType={nrType}
            content={content}
            autoValidate={autoValidate}
          />

          {/* Quick Actions */}
          {suggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span>Sugestões Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {getTopSuggestions().map((suggestion, index) => (
                  <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-700 mb-2">{suggestion}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aplicar
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Missing Topics */}
          {missingTopics.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  <span>Tópicos Ausentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {missingTopics.slice(0, 5).map((topic, index) => (
                  <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-xs text-orange-700">{topic}</p>
                  </div>
                ))}
                {missingTopics.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{missingTopics.length - 5} tópicos adicionais
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Critical Points */}
          {criticalPoints.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>Pontos Críticos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {criticalPoints.slice(0, 3).map((point, index) => (
                  <div key={index} className="p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-700">{point}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}