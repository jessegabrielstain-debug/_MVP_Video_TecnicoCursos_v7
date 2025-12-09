
'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, AlertCircle, FileCheck, Lightbulb } from 'lucide-react';
import { toast } from 'react-hot-toast';

type ValidationResult = {
  score: number;
  topicsCovered: string[];
  topicsMissing: string[];
  criticalPointsCovered: string[];
  criticalPointsMissing: string[];
  suggestions: string[];
  complianceStatus: 'compliant' | 'partial' | 'non-compliant';
};

export function ComplianceValidator({ projectId }: { projectId?: string }) {
  const [nrType, setNrType] = useState<string>('NR-12');
  const [content, setContent] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    if (!content.trim()) {
      toast.error('Digite o conteúdo para validação');
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch('/api/compliance/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nrType, content, projectId }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResult(data.validation);
        toast.success(`Score de Compliance: ${data.validation.score}%`);
      } else {
        toast.error('Erro na validação');
      }
    } catch (error) {
      logger.error('Erro ao validar compliance', error instanceof Error ? error : new Error(String(error)), { component: 'ComplianceValidator' });
      toast.error('Erro ao validar compliance');
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      case 'non-compliant':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'Conforme';
      case 'partial':
        return 'Parcialmente Conforme';
      case 'non-compliant':
        return 'Não Conforme';
      default:
        return 'Não Validado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Validador de Compliance NR
          </CardTitle>
          <CardDescription>
            Valide se seu conteúdo está em conformidade com as Normas Regulamentadoras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Norma Regulamentadora</label>
            <Select value={nrType} onValueChange={setNrType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NR-12">NR-12 - Máquinas e Equipamentos</SelectItem>
                <SelectItem value="NR-33">NR-33 - Espaços Confinados</SelectItem>
                <SelectItem value="NR-35">NR-35 - Trabalho em Altura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo do Treinamento</label>
            <Textarea
              placeholder="Cole ou digite o conteúdo do seu treinamento aqui..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {content.length} caracteres
            </p>
          </div>

          <Button
            onClick={handleValidate}
            disabled={isValidating || !content.trim()}
            className="w-full"
          >
            {isValidating ? 'Validando...' : 'Validar Compliance'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {result && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resultado da Validação</CardTitle>
              <Badge className={getStatusColor(result.complianceStatus)}>
                {getStatusLabel(result.complianceStatus)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Score de Compliance</span>
                <span className="text-2xl font-bold">{result.score}%</span>
              </div>
              <Progress value={result.score} className="h-3" />
            </div>

            {/* Tópicos Cobertos */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Tópicos Cobertos ({result.topicsCovered.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.topicsCovered.map((topic, i) => (
                  <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tópicos Faltantes */}
            {result.topicsMissing.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Tópicos Faltantes ({result.topicsMissing.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.topicsMissing.map((topic, i) => (
                    <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pontos Críticos */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Pontos Críticos Cobertos
                </h3>
                <ul className="text-sm space-y-1">
                  {result.criticalPointsCovered.map((point, i) => (
                    <li key={i} className="text-green-700">✓ {point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  Pontos Críticos Faltantes
                </h3>
                <ul className="text-sm space-y-1">
                  {result.criticalPointsMissing.map((point, i) => (
                    <li key={i} className="text-yellow-700">⚠ {point}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sugestões */}
            {result.suggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  Sugestões de Melhoria
                </h3>
                <ul className="text-sm space-y-1">
                  {result.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-blue-700">• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
