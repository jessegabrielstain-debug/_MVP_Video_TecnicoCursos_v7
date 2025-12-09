

/**
 * 🏗️ NR Template Studio Revolucionário
 * Sistema Avançado de Templates para Normas Regulamentadoras
 */

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  HardHat,
  Shield,
  AlertTriangle,
  CheckCircle,
  FileText,
  Video,
  Brain,
  Target,
  Users,
  Award,
  Globe,
  Clock,
  BarChart3,
  Zap,
  Eye,
  Settings,
  Download,
  Play,
  RefreshCw,
  Sparkles,
  Building,
  Briefcase,
  TrendingUp,
  Activity,
  Star,
  Crown,
  Rocket,
  Database,
  Palette,
  Monitor,
  HeadphonesIcon,
  Camera,
  Mic
} from 'lucide-react';
import Image from 'next/image';

interface NRTemplate {
  id: string;
  nome: string;
  nr: string;
  categoria: string;
  tipo: 'video-base' | 'interativo' | '3d-imersivo' | 'gamificado' | 'micro-learning';
  duracaoMinutos: number;
  complexidade: 1 | 2 | 3 | 4 | 5;
  setoresAlvo: string[];
  recursos: {
    avatar3D: boolean;
    cenarios3D: boolean;
    quizInterativo: boolean;
    realidadeVirtual: boolean;
    narracaoIA: boolean;
    legendasAutomaticas: boolean;
  };
  conformidade: {
    mte: boolean;
    certificacao: boolean;
    auditoria: boolean;
    rastreabilidade: boolean;
  };
  preview: string;
  estatisticas: {
    uso: number;
    satisfacao: number;
    eficacia: number;
  };
}

interface VideoGenerationConfig {
  template: NRTemplate;
  customizacoes: {
    empresa: string;
    setor: string;
    logoEmpresa?: string;
    coresPersonalizadas?: string[];
    narrativaPersonalizada?: string;
  };
  opcoes: {
    qualidade: '720p' | '1080p' | '4K';
    formato: 'MP4' | 'WebM' | 'MOV';
    duracao: 'curta' | 'media' | 'completa';
    idioma: 'pt-BR';
    acessibilidade: {
      legendas: boolean;
      audioDescricao: boolean;
      libras: boolean;
    };
  };
}

export default function NRTemplateStudio() {
  const [selectedNR, setSelectedNR] = useState('NR-06');
  const [selectedTemplate, setSelectedTemplate] = useState<NRTemplate | null>(null);
  const [customizacoes, setCustomizacoes] = useState({
    empresa: '',
    setor: '',
    logoEmpresa: '',
    narrativaPersonalizada: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const templatesRevolucionarios: NRTemplate[] = [
    {
      id: 'nr06-epi-3d-imersivo',
      nome: 'EPIs 3D Imersivo',
      nr: 'NR-06',
      categoria: 'Proteção Individual',
      tipo: '3d-imersivo',
      duracaoMinutos: 18,
      complexidade: 3,
      setoresAlvo: ['Construção', 'Industrial', 'Químico'],
      recursos: {
        avatar3D: true,
        cenarios3D: true,
        quizInterativo: true,
        realidadeVirtual: true,
        narracaoIA: true,
        legendasAutomaticas: true
      },
      conformidade: {
        mte: true,
        certificacao: true,
        auditoria: true,
        rastreabilidade: true
      },
      preview: '/templates/nr06-epi-3d-preview.jpg',
      estatisticas: {
        uso: 567,
        satisfacao: 4.8,
        eficacia: 96
      }
    },
    {
      id: 'nr10-eletrica-realista',
      nome: 'Eletricidade Realista',
      nr: 'NR-10',
      categoria: 'Segurança Elétrica',
      tipo: 'interativo',
      duracaoMinutos: 45,
      complexidade: 5,
      setoresAlvo: ['Elétrico', 'Industrial', 'Telecomunicações'],
      recursos: {
        avatar3D: true,
        cenarios3D: true,
        quizInterativo: true,
        realidadeVirtual: false,
        narracaoIA: true,
        legendasAutomaticas: true
      },
      conformidade: {
        mte: true,
        certificacao: true,
        auditoria: true,
        rastreabilidade: true
      },
      preview: '/templates/nr10-eletrica-preview.jpg',
      estatisticas: {
        uso: 389,
        satisfacao: 4.9,
        eficacia: 98
      }
    },
    {
      id: 'nr12-maquinas-pratico',
      nome: 'Máquinas Seguras Prático',
      nr: 'NR-12',
      categoria: 'Segurança em Máquinas',
      tipo: 'interativo',
      duracaoMinutos: 35,
      complexidade: 4,
      setoresAlvo: ['Metalúrgico', 'Automobilístico', 'Alimentício'],
      recursos: {
        avatar3D: true,
        cenarios3D: true,
        quizInterativo: true,
        realidadeVirtual: true,
        narracaoIA: true,
        legendasAutomaticas: true
      },
      conformidade: {
        mte: true,
        certificacao: true,
        auditoria: true,
        rastreabilidade: true
      },
      preview: '/templates/nr12-maquinas-preview.jpg',
      estatisticas: {
        uso: 445,
        satisfacao: 4.7,
        eficacia: 95
      }
    },
    {
      id: 'nr35-altura-extremo',
      nome: 'Trabalho em Altura Extremo',
      nr: 'NR-35',
      categoria: 'Trabalho em Altura',
      tipo: '3d-imersivo',
      duracaoMinutos: 42,
      complexidade: 5,
      setoresAlvo: ['Construção', 'Industrial', 'Telecomunicações'],
      recursos: {
        avatar3D: true,
        cenarios3D: true,
        quizInterativo: true,
        realidadeVirtual: true,
        narracaoIA: true,
        legendasAutomaticas: true
      },
      conformidade: {
        mte: true,
        certificacao: true,
        auditoria: true,
        rastreabilidade: true
      },
      preview: '/templates/nr35-altura-preview.jpg',
      estatisticas: {
        uso: 356,
        satisfacao: 4.9,
        eficacia: 98
      }
    },
    {
      id: 'nr17-ergonomia-smart',
      nome: 'Ergonomia Inteligente',
      nr: 'NR-17',
      categoria: 'Ergonomia',
      tipo: 'interativo',
      duracaoMinutos: 28,
      complexidade: 2,
      setoresAlvo: ['Escritório', 'Industrial', 'Saúde'],
      recursos: {
        avatar3D: true,
        cenarios3D: false,
        quizInterativo: true,
        realidadeVirtual: false,
        narracaoIA: true,
        legendasAutomaticas: true
      },
      conformidade: {
        mte: true,
        certificacao: true,
        auditoria: true,
        rastreabilidade: true
      },
      preview: '/templates/nr17-ergonomia-preview.jpg',
      estatisticas: {
        uso: 234,
        satisfacao: 4.6,
        eficacia: 93
      }
    }
  ];

  const handleGenerateVideo = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const config: VideoGenerationConfig = {
        template: selectedTemplate,
        customizacoes,
        opcoes: {
          qualidade: '1080p',
          formato: 'MP4',
          duracao: 'completa',
          idioma: 'pt-BR',
          acessibilidade: {
            legendas: true,
            audioDescricao: true,
            libras: false
          }
        }
      };

      const response = await fetch('/api/v4/nr-template-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        // Simular progresso
        const interval = setInterval(() => {
          setGenerationProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsGenerating(false);
              return 100;
            }
            return prev + 10;
          });
        }, 500);
      }
    } catch (error) {
      logger.error('Erro na geração de template NR', error instanceof Error ? error : new Error(String(error)), { component: 'NRTemplateStudio' });
      setIsGenerating(false);
    }
  };

  const getComplexityColor = (level: number) => {
    const colors = {
      1: 'text-green-600',
      2: 'text-blue-600', 
      3: 'text-yellow-600',
      4: 'text-orange-600',
      5: 'text-red-600'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600';
  };

  const getComplexityLabel = (level: number) => {
    const labels = {
      1: 'Básico',
      2: 'Fácil',
      3: 'Intermediário',
      4: 'Avançado',
      5: 'Especialista'
    };
    return labels[level as keyof typeof labels] || 'N/A';
  };

  const filteredTemplates = templatesRevolucionarios.filter(
    template => selectedNR === 'all' || template.nr === selectedNR
  );

  return (
    <div className="space-y-8">
      
      {/* Header do Studio */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <HardHat className="h-10 w-10 text-orange-600" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            NR Template Studio
          </h2>
          <Building className="h-10 w-10 text-blue-600" />
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Templates revolucionários com IA especializada em regulamentações brasileiras
        </p>
      </div>

      {/* Seletor e Configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Norma Regulamentadora</label>
                  <Select value={selectedNR} onValueChange={setSelectedNR}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as NRs</SelectItem>
                      <SelectItem value="NR-01">NR-01 - Disposições Gerais</SelectItem>
                      <SelectItem value="NR-06">NR-06 - EPIs</SelectItem>
                      <SelectItem value="NR-10">NR-10 - Eletricidade</SelectItem>
                      <SelectItem value="NR-12">NR-12 - Máquinas</SelectItem>
                      <SelectItem value="NR-17">NR-17 - Ergonomia</SelectItem>
                      <SelectItem value="NR-35">NR-35 - Altura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Setor da Empresa</label>
                  <Select 
                    value={customizacoes.setor} 
                    onValueChange={(value) => setCustomizacoes(prev => ({ ...prev, setor: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construcao">Construção Civil</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="eletrico">Elétrico</SelectItem>
                      <SelectItem value="metalurgico">Metalúrgico</SelectItem>
                      <SelectItem value="quimico">Químico</SelectItem>
                      <SelectItem value="alimenticio">Alimentício</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="saude">Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Nome da Empresa</label>
                <Input 
                  placeholder="Digite o nome da sua empresa"
                  value={customizacoes.empresa}
                  onChange={(e) => setCustomizacoes(prev => ({ ...prev, empresa: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Narrativa Personalizada (Opcional)</label>
                <Textarea 
                  placeholder="Adicione contextos específicos da sua empresa..."
                  value={customizacoes.narrativaPersonalizada}
                  onChange={(e) => setCustomizacoes(prev => ({ ...prev, narrativaPersonalizada: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Geração IA</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTemplate && (
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="font-medium">{selectedTemplate.nome}</div>
                    <div className="text-gray-500">{selectedTemplate.nr}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Duração estimada</span>
                      <span className="font-bold">{selectedTemplate.duracaoMinutos}min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Complexidade</span>
                      <span className={`font-bold ${getComplexityColor(selectedTemplate.complexidade)}`}>
                        {getComplexityLabel(selectedTemplate.complexidade)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Eficácia</span>
                      <span className="font-bold text-green-600">{selectedTemplate.estatisticas.eficacia}%</span>
                    </div>
                  </div>

                  {isGenerating && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progresso</span>
                        <span>{generationProgress}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                      <div className="text-xs text-gray-500 text-center">
                        {generationProgress < 30 ? 'Analisando NR...' :
                         generationProgress < 60 ? 'Gerando cenários...' :
                         generationProgress < 90 ? 'Renderizando vídeo...' :
                         'Finalizando...'}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleGenerateVideo}
                    disabled={isGenerating || !customizacoes.empresa}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {isGenerating ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Gerar Vídeo NR
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grid de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg group ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-orange-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedTemplate(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Badge className="bg-orange-100 text-orange-800">
                    {template.nr}
                  </Badge>
                  <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                    {template.nome}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {template.categoria}
                  </CardDescription>
                </div>
                <Badge 
                  variant="outline"
                  className={getComplexityColor(template.complexidade)}
                >
                  {getComplexityLabel(template.complexidade)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Preview Image */}
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Video className="h-8 w-8 text-gray-400 mx-auto" />
                    <div className="text-xs text-gray-500">Preview {template.tipo}</div>
                  </div>
                </div>
              </div>

              {/* Recursos */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-600">Recursos Inclusos:</div>
                <div className="flex flex-wrap gap-1">
                  {template.recursos.avatar3D && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Avatar 3D
                    </Badge>
                  )}
                  {template.recursos.cenarios3D && (
                    <Badge variant="outline" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      Cenários 3D
                    </Badge>
                  )}
                  {template.recursos.quizInterativo && (
                    <Badge variant="outline" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      Quiz
                    </Badge>
                  )}
                  {template.recursos.narracaoIA && (
                    <Badge variant="outline" className="text-xs">
                      <Mic className="h-3 w-3 mr-1" />
                      Narração IA
                    </Badge>
                  )}
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="font-bold text-blue-600">{template.estatisticas.uso}</div>
                  <div className="text-gray-500">Usos</div>
                </div>
                <div>
                  <div className="font-bold text-green-600">{template.estatisticas.satisfacao}</div>
                  <div className="text-gray-500">Satisfação</div>
                </div>
                <div>
                  <div className="font-bold text-purple-600">{template.estatisticas.eficacia}%</div>
                  <div className="text-gray-500">Eficácia</div>
                </div>
              </div>

              {/* Setores Alvo */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Setores:</div>
                <div className="flex flex-wrap gap-1">
                  {template.setoresAlvo.slice(0, 3).map((setor) => (
                    <Badge key={setor} variant="secondary" className="text-xs">
                      {setor}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Conformidade */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700">100% Conforme MTE</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-700">Certificado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Selecionado - Detalhes */}
      {selectedTemplate && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-orange-600" />
              <span>Template Selecionado: {selectedTemplate.nome}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Recursos Técnicos</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedTemplate.recursos).map(([recurso, ativo]) => (
                      <div key={recurso} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{recurso.replace(/([A-Z])/g, ' $1')}</span>
                        <Badge className={ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                          {ativo ? 'Incluído' : 'N/A'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Conformidade Regulamentária</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedTemplate.conformidade).map(([item, conforme]) => (
                      <div key={item} className="flex items-center space-x-2">
                        <CheckCircle className={`h-4 w-4 ${conforme ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="text-sm capitalize">{item.replace(/([A-Z])/g, ' $1')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Setores de Aplicação</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.setoresAlvo.map((setor) => (
                      <Badge key={setor} variant="outline">
                        {setor}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Estatísticas de Performance</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Taxa de Satisfação</span>
                        <span className="text-sm font-bold">{selectedTemplate.estatisticas.satisfacao}/5</span>
                      </div>
                      <Progress value={selectedTemplate.estatisticas.satisfacao * 20} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Eficácia de Aprendizado</span>
                        <span className="text-sm font-bold">{selectedTemplate.estatisticas.eficacia}%</span>
                      </div>
                      <Progress value={selectedTemplate.estatisticas.eficacia} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

