'use client';

import React, { useState, useCallback } from 'react';
import { WYSIWYGEditor, type WysiwygProjectSnapshot, type ExportFormat } from '@/components/editor/wysiwyg-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Save,
  Download,
  Share2,
  Settings,
  Play,
  Eye,
  Code,
  FileText,
  BarChart3,
  Users,
  Shield,
  Zap,
  Brain,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Layers,
  Palette,
  Volume2,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function EditorWYSIWYGPage() {
  const router = useRouter();
  const [projectData, setProjectData] = useState<WysiwygProjectSnapshot | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeView, setActiveView] = useState('editor');

  const handleSave = useCallback((data: WysiwygProjectSnapshot) => {
    setProjectData(data);
    toast.success('Projeto salvo com sucesso!');
    console.log('Saving project data:', data);
  }, []);

  const handleExport = useCallback((format: ExportFormat) => {
    toast.success(`Projeto exportado em formato ${format.toUpperCase()}!`);
    console.log('Exporting project in format:', format);
  }, []);

  const handleShare = useCallback(() => {
    toast.success('Link de compartilhamento copiado!');
    console.log('Sharing project');
  }, []);

  const renderHeader = () => (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="h-6 w-px bg-gray-300" />

        <div>
          <h1 className="text-lg font-semibold">Editor WYSIWYG Avançado</h1>
          <p className="text-sm text-gray-500">Criação de conteúdo interativo com IA</p>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Auto-save ativo
        </Badge>

        <div className="h-6 w-px bg-gray-300" />

        <Button
          variant={activeView === 'editor' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('editor')}
        >
          <Layers className="w-4 h-4 mr-1" />
          Editor
        </Button>

        <Button
          variant={activeView === 'preview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('preview')}
        >
          <Eye className="w-4 h-4 mr-1" />
          Preview
        </Button>

        <Button
          variant={activeView === 'code' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('code')}
        >
          <Code className="w-4 h-4 mr-1" />
          Código
        </Button>

        <Button
          variant={activeView === 'analytics' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('analytics')}
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Analytics
        </Button>

        <div className="h-6 w-px bg-gray-300" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4 mr-1" />
          Compartilhar
        </Button>

        <Button
          variant="outline"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-1" />
          Configurações
        </Button>
      </div>
    </div>
  );

  const renderPreviewControls = () => (
    <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Dispositivo:</span>
        
        <Button
          variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setPreviewDevice('desktop')}
        >
          <Monitor className="w-4 h-4 mr-1" />
          Desktop
        </Button>

        <Button
          variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setPreviewDevice('tablet')}
        >
          <Tablet className="w-4 h-4 mr-1" />
          Tablet
        </Button>

        <Button
          variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setPreviewDevice('mobile')}
        >
          <Smartphone className="w-4 h-4 mr-1" />
          Mobile
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-300" />

      <Button
        variant="outline"
        size="sm"
      >
        <Play className="w-4 h-4 mr-1" />
        Reproduzir
      </Button>

      <Button
        variant="outline"
        size="sm"
      >
        <Volume2 className="w-4 h-4 mr-1" />
        Áudio
      </Button>
    </div>
  );

  const renderPreview = () => {
    const deviceStyles = {
      desktop: { width: '100%', height: '100%' },
      tablet: { width: '768px', height: '1024px', margin: '0 auto' },
      mobile: { width: '375px', height: '667px', margin: '0 auto' },
    };

    return (
      <div className="flex-1 bg-gray-100 p-4 overflow-auto">
        <div 
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={deviceStyles[previewDevice]}
        >
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Preview do Projeto</h3>
              <p className="text-sm">O conteúdo criado no editor será exibido aqui</p>
              <p className="text-xs text-gray-400 mt-2">
                Dispositivo: {previewDevice} ({deviceStyles[previewDevice].width})
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCodeView = () => (
    <div className="flex-1 bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-auto">
      <div className="mb-4">
        <div className="text-gray-500">// Código gerado automaticamente pelo Editor WYSIWYG</div>
        <div className="text-gray-500">// Este código é otimizado para performance e acessibilidade</div>
      </div>
      
      <div className="space-y-2">
        <div><span className="text-blue-400">const</span> <span className="text-yellow-400">projectConfig</span> = &#123;</div>
        <div className="ml-4"><span className="text-purple-400">version</span>: <span className="text-green-300">"1.0"</span>,</div>
        <div className="ml-4"><span className="text-purple-400">type</span>: <span className="text-green-300">"safety-training"</span>,</div>
        <div className="ml-4"><span className="text-purple-400">compliance</span>: &#123;</div>
        <div className="ml-8"><span className="text-purple-400">nrStandards</span>: [<span className="text-green-300">"NR-12"</span>, <span className="text-green-300">"NR-35"</span>],</div>
        <div className="ml-8"><span className="text-purple-400">accessibilityLevel</span>: <span className="text-green-300">"AA"</span>,</div>
        <div className="ml-8"><span className="text-purple-400">safetyRating</span>: <span className="text-orange-400">95</span></div>
        <div className="ml-4">&#125;,</div>
        <div className="ml-4"><span className="text-purple-400">layers</span>: [</div>
        <div className="ml-8">&#123;</div>
        <div className="ml-12"><span className="text-purple-400">id</span>: <span className="text-green-300">"background"</span>,</div>
        <div className="ml-12"><span className="text-purple-400">type</span>: <span className="text-green-300">"image"</span>,</div>
        <div className="ml-12"><span className="text-purple-400">src</span>: <span className="text-green-300">"workplace-safety.jpg"</span>,</div>
        <div className="ml-12"><span className="text-purple-400">position</span>: &#123; <span className="text-purple-400">x</span>: <span className="text-orange-400">0</span>, <span className="text-purple-400">y</span>: <span className="text-orange-400">0</span> &#125;</div>
        <div className="ml-8">&#125;</div>
        <div className="ml-4">],</div>
        <div className="ml-4"><span className="text-purple-400">timeline</span>: &#123;</div>
        <div className="ml-8"><span className="text-purple-400">duration</span>: <span className="text-orange-400">60000</span>,</div>
        <div className="ml-8"><span className="text-purple-400">keyframes</span>: [],</div>
        <div className="ml-8"><span className="text-purple-400">markers</span>: []</div>
        <div className="ml-4">&#125;</div>
        <div>&#125;;</div>
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded">
        <div className="text-yellow-400 mb-2">// Estatísticas de Performance</div>
        <div className="text-gray-400">Bundle size: 245KB (gzipped)</div>
        <div className="text-gray-400">Load time: &lt; 2s</div>
        <div className="text-gray-400">Accessibility score: 98/100</div>
        <div className="text-gray-400">SEO score: 95/100</div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="flex-1 p-6 bg-gray-50 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                Visualizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-gray-500">+12% vs mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-gray-500">Taxa de conclusão</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-500" />
                Conformidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">95/100</div>
              <p className="text-xs text-gray-500">Score de segurança</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.8s</div>
              <p className="text-xs text-gray-500">Tempo de carregamento</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Métricas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tempo médio de sessão</span>
                  <span className="font-medium">8m 32s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Interações por sessão</span>
                  <span className="font-medium">15.3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de rejeição</span>
                  <span className="font-medium">12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dispositivos móveis</span>
                  <span className="font-medium">68%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Insights de IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Otimização sugerida</p>
                    <p className="text-xs text-gray-500">Adicionar mais pontos de interação no minuto 3</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Atenção necessária</p>
                    <p className="text-xs text-gray-500">Contraste de cores pode ser melhorado</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Oportunidade</p>
                    <p className="text-xs text-gray-500">Adicionar quiz interativo aumentaria engajamento</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Feedback dos Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Facilidade de uso</span>
                    <span className="text-sm font-medium">4.8/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }} />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Qualidade do conteúdo</span>
                    <span className="text-sm font-medium">4.6/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Relevância para segurança</span>
                    <span className="text-sm font-medium">4.9/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '98%' }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'editor':
        return (
          <WYSIWYGEditor
            projectId="demo-project"
            onSave={handleSave}
            onExport={handleExport}
            className="flex-1"
          />
        );
      case 'preview':
        return (
          <div className="flex-1 flex flex-col">
            {renderPreviewControls()}
            {renderPreview()}
          </div>
        );
      case 'code':
        return renderCodeView();
      case 'analytics':
        return renderAnalytics();
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {renderHeader()}
      {renderContent()}
    </div>
  );
}