'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useTimeline, PPTXSlide } from '@/hooks/useTimeline';
// import PPTXUploader from '@/app/components/PPTXUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  FileText, 
  Play, 
  Upload, 
  Clock, 
  Image, 
  Type, 
  Volume2, 
  Eye, 
  Settings, 
  Download 
} from 'lucide-react';

interface PPTXData {
  fileName?: string;
  slides: PPTXSlide[];
  textElements?: number;
  audioElements?: number;
}

interface PPTXTimelineIntegrationProps {
  pptxData?: PPTXData;
  onTimelineCreated?: (projectId: string) => void;
}

export function PPTXTimelineIntegration({ 
  pptxData, 
  onTimelineCreated 
}: PPTXTimelineIntegrationProps) {
  const timeline = useTimeline();
  const [processingStep, setProcessingStep] = useState<'idle' | 'analyzing' | 'creating' | 'complete'>('idle');
  const [uploadedPPTX, setUploadedPPTX] = useState<PPTXData | null>(null);

  const handleCreateTimeline = useCallback(async () => {
    const dataToUse = pptxData || uploadedPPTX;
    
    if (!dataToUse) {
      toast.error('Nenhum dado PPTX disponível');
      return;
    }

    setProcessingStep('analyzing');
    
    try {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStep('creating');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create timeline project from PPTX data
      timeline.loadFromPPTX(dataToUse);
      
      setProcessingStep('complete');
      
      if (onTimelineCreated && timeline.project) {
        onTimelineCreated(timeline.project.id);
      }

      toast.success('Timeline criada com sucesso!');
    } catch (error) {
      setProcessingStep('idle');
      toast.error('Erro ao criar timeline');
      logger.error('Timeline creation error', error instanceof Error ? error : new Error(String(error)), { pptxFileName: dataToUse.fileName, slidesCount: dataToUse.slides.length, component: 'PPTXTimelineIntegration' });
    }
  }, [pptxData, uploadedPPTX, timeline, onTimelineCreated]);

  const handlePPTXUpload = useCallback((data: unknown) => {
    const pptxData = data as PPTXData;
    setUploadedPPTX(pptxData);
    toast.success(`PPTX carregado: ${pptxData.fileName}`);
  }, []);

  const handleOpenTimelineEditor = useCallback(() => {
    if (timeline.project) {
      window.open(`/timeline-editor?project=${timeline.project.id}`, '_blank');
    }
  }, [timeline.project]);

  const getStepStatus = (step: string) => {
    const steps = ['analyzing', 'creating', 'complete'];
    const currentIndex = steps.indexOf(processingStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const currentData = pptxData || uploadedPPTX;

  if (!currentData) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Integração PPTX → Timeline</CardTitle>
            <CardDescription>
              Faça upload de um arquivo PPTX para começar a criar sua timeline de vídeo
            </CardDescription>
          </CardHeader>
        </Card>
        
        {/* PPTX Uploader */}
        <Card>
          <CardHeader>
            <CardTitle>Upload PPTX</CardTitle>
            <CardDescription>
              Selecione um arquivo PowerPoint para converter em timeline de vídeo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <PPTXUploader onProcessed={handlePPTXUpload} /> */}
            <div>PPTX Uploader Component (temporariamente desabilitado)</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PPTX Data Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Arquivo PPTX Carregado</CardTitle>
          </div>
          <CardDescription>
            Dados extraídos do arquivo: {currentData.fileName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">{currentData.slides?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Slides</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">{currentData.textElements || 0}</div>
                <div className="text-xs text-muted-foreground">Textos</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-sm font-medium">
                  {Math.ceil((currentData.slides?.length || 0) * 5 / 60)}min
                </div>
                <div className="text-xs text-muted-foreground">Duração Est.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-sm font-medium">{currentData.audioElements || 0}</div>
                <div className="text-xs text-muted-foreground">Áudios</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Creation Process */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Timeline de Vídeo</CardTitle>
          <CardDescription>
            Converta seu PPTX em uma timeline editável para produção de vídeo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {processingStep === 'idle' && (
            <Button 
              onClick={handleCreateTimeline}
              className="w-full"
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              Criar Timeline de Vídeo
            </Button>
          )}

          {processingStep !== 'idle' && (
            <div className="space-y-4">
              {/* Processing Steps */}
              <div className="space-y-2">
                <div className={`flex items-center gap-2 p-2 rounded ${
                  getStepStatus('analyzing') === 'active' ? 'bg-blue-50 border border-blue-200' :
                  getStepStatus('analyzing') === 'complete' ? 'bg-green-50 border border-green-200' :
                  'bg-muted'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    getStepStatus('analyzing') === 'active' ? 'bg-blue-500 animate-pulse' :
                    getStepStatus('analyzing') === 'complete' ? 'bg-green-500' :
                    'bg-muted-foreground'
                  }`} />
                  <span className="text-sm">Analisando estrutura do PPTX...</span>
                </div>

                <div className={`flex items-center gap-2 p-2 rounded ${
                  getStepStatus('creating') === 'active' ? 'bg-blue-50 border border-blue-200' :
                  getStepStatus('creating') === 'complete' ? 'bg-green-50 border border-green-200' :
                  'bg-muted'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    getStepStatus('creating') === 'active' ? 'bg-blue-500 animate-pulse' :
                    getStepStatus('creating') === 'complete' ? 'bg-green-500' :
                    'bg-muted-foreground'
                  }`} />
                  <span className="text-sm">Criando tracks e elementos...</span>
                </div>

                <div className={`flex items-center gap-2 p-2 rounded ${
                  getStepStatus('complete') === 'active' ? 'bg-green-50 border border-green-200' :
                  'bg-muted'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    getStepStatus('complete') === 'active' ? 'bg-green-500' :
                    'bg-muted-foreground'
                  }`} />
                  <span className="text-sm">Timeline criada com sucesso!</span>
                </div>
              </div>
            </div>
          )}

          {processingStep === 'complete' && timeline.project && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Projeto: {timeline.project.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {timeline.project.tracks.length} tracks • {timeline.project.duration}s duração
                  </p>
                </div>
                <Badge className="bg-green-600 hover:bg-green-700">
                  <Eye className="mr-1 h-3 w-3" />
                  Pronto
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleOpenTimelineEditor}
                  className="flex-1"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Abrir Editor
                </Button>
                <Button 
                  variant="outline"
                  onClick={timeline.exportToVideo}
                  disabled={timeline.isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Preview */}
      {timeline.project && (
        <Card>
          <CardHeader>
            <CardTitle>Preview da Timeline</CardTitle>
            <CardDescription>
              Estrutura das tracks criadas a partir do seu PPTX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeline.project.tracks.map((track, index) => (
                <div key={track.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${
                        track.type === 'video' ? 'bg-blue-500' :
                        track.type === 'audio' ? 'bg-green-500' :
                        'bg-purple-500'
                      }`} />
                      <span className="text-sm font-medium">{track.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {track.elements.length} elementos
                      </Badge>
                    </div>
                    <Badge variant={track.visible ? 'default' : 'secondary'}>
                      {track.visible ? 'Visível' : 'Oculto'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1 overflow-hidden">
                    {track.elements.map((element, idx) => (
                      <div
                        key={element.id}
                        className={`h-6 rounded text-xs px-2 flex items-center justify-center text-white ${
                          element.type === 'image' ? 'bg-blue-400' :
                          element.type === 'text' ? 'bg-green-400' :
                          element.type === 'audio' ? 'bg-orange-400' :
                          'bg-purple-400'
                        }`}
                        style={{ 
                          width: `${Math.max(60, element.duration * 10)}px`,
                          marginLeft: idx === 0 ? `${element.startTime * 10}px` : '2px'
                        }}
                        title={`${element.name} (${element.duration}s)`}
                      >
                        {element.name.length > 8 ? `${element.name.slice(0, 8)}...` : element.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PPTXTimelineIntegration;