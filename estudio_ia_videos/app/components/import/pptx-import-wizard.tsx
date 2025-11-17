
/**
 * Wizard de Importação PPTX → Timeline
 */
'use client';

import { useState } from 'react';
import { usePPTXImport } from '@/lib/hooks/use-pptx-import';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle, 
  Circle, 
  Loader2, 
  Upload, 
  FileText,
  Settings,
  Wand2,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function PPTXImportWizard() {
  const router = useRouter();
  const {
    steps,
    currentStep,
    slides,
    config,
    isProcessing,
    result,
    nextStep,
    prevStep,
    uploadPPTX,
    analyzeSlides,
    updateConfig,
    toggleSlideSelection,
    updateSlideDuration,
    convertToTimeline,
    reset,
  } = usePPTXImport();

  const [file, setFile] = useState<File | null>(null);
  const [pptxId, setPptxId] = useState<string>('');
  const [projectName, setProjectName] = useState('');

  // Step 1: Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.pptx')) {
      setFile(selectedFile);
      setProjectName(selectedFile.name.replace('.pptx', ''));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      const data = await uploadPPTX(file);
      setPptxId(data.id);
      // Auto-avançar para análise
      await handleAnalyze(data.id);
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  // Step 2: Análise
  const handleAnalyze = async (id: string) => {
    try {
      await analyzeSlides(id);
    } catch (error) {
      console.error('Erro na análise:', error);
    }
  };

  // Step 3: Configuração (próximo manual)
  const handleConfigNext = () => {
    nextStep();
  };

  // Step 4: Conversão
  const handleConvert = async () => {
    try {
      await convertToTimeline(pptxId, projectName);
    } catch (error) {
      console.error('Erro na conversão:', error);
    }
  };

  // Step 5: Finalização
  const handleFinish = () => {
    if (result?.projectId) {
      router.push(`/editor/${result.projectId}`);
    }
  };

  const handleNewImport = () => {
    reset();
    setFile(null);
    setPptxId('');
    setProjectName('');
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header com Steps */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Importar PPTX para Timeline</h1>
        <p className="text-muted-foreground">
          Converta sua apresentação em um projeto de vídeo editável
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 px-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step.status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.status === 'active'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : step.status === 'error'
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-muted border-muted-foreground/20'
                }`}
              >
                {step.status === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : step.status === 'error' ? (
                  <X className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content baseado no step atual */}
      <Card>
        <CardContent className="p-6">
          {/* STEP 1: Upload */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Selecione um arquivo PPTX</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arraste e solte ou clique para selecionar
                </p>
                <Input
                  type="file"
                  accept=".pptx"
                  onChange={handleFileSelect}
                  className="max-w-xs mx-auto"
                />
              </div>

              {file && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-10 h-10 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={!file || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar e Analisar
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Análise (auto, mostra loader) */}
          {currentStep === 1 && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Analisando slides...</h3>
              <p className="text-sm text-muted-foreground">
                Extraindo conteúdo e gerando previews
              </p>
            </div>
          )}

          {/* STEP 3: Configuração */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="projectName">Nome do Projeto</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Meu Projeto de Vídeo"
                />
              </div>

              <div>
                <Label>Duração Padrão por Slide: {config.slideDuration}s</Label>
                <Slider
                  value={[config.slideDuration]}
                  onValueChange={([value]) => updateConfig({ slideDuration: value })}
                  min={3}
                  max={15}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Transição entre Slides</Label>
                <select
                  value={config.transition}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'fade' || value === 'slide' || value === 'none') {
                      updateConfig({ transition: value });
                    }
                  }}
                  className="w-full mt-2 p-2 border rounded"
                >
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                  <option value="none">Sem Transição</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={config.addAudio}
                  onCheckedChange={(checked) => updateConfig({ addAudio: checked })}
                />
                <Label>Adicionar Narração (TTS)</Label>
              </div>

              {/* Preview de slides */}
              <div>
                <Label>Slides Selecionados ({slides.filter(s => s.selected).length}/{slides.length})</Label>
                <div className="grid grid-cols-3 gap-4 mt-4 max-h-96 overflow-y-auto">
                  {slides.map((slide) => (
                    <div
                      key={slide.slideNumber}
                      className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                        slide.selected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-muted opacity-50'
                      }`}
                      onClick={() => toggleSlideSelection(slide.slideNumber)}
                    >
                      <div className="aspect-video relative bg-muted rounded overflow-hidden mb-2">
                        <Image
                          src={slide.thumbnailUrl}
                          alt={slide.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs font-medium truncate">{slide.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Slide {slide.slideNumber} • {slide.duration}s
                      </div>
                      {slide.selected && (
                        <div className="absolute top-1 right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={handleConfigNext}>
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Conversão */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Wand2 className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                <h3 className="text-lg font-semibold mb-2">Pronto para Converter!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Vamos criar seu projeto com {slides.filter(s => s.selected).length} slides
                </p>

                <div className="bg-muted/50 p-4 rounded-lg max-w-md mx-auto text-left">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Projeto:</span>
                      <span className="font-medium">{projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slides:</span>
                      <span className="font-medium">{slides.filter(s => s.selected).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duração:</span>
                      <span className="font-medium">
                        {slides.filter(s => s.selected).reduce((acc, s) => acc + s.duration, 0)}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transição:</span>
                      <span className="font-medium capitalize">{config.transition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Narração:</span>
                      <span className="font-medium">{config.addAudio ? 'Sim (TTS)' : 'Não'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={prevStep} disabled={isProcessing}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={handleConvert} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Convertendo...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Converter para Timeline
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: Sucesso */}
          {currentStep === 4 && result?.success && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Conversão Concluída!</h3>
              <p className="text-muted-foreground mb-6">
                Seu projeto está pronto para edição
              </p>

              <div className="bg-muted/50 p-4 rounded-lg max-w-md mx-auto text-left mb-6">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Clips criados:</span>
                    <span className="font-medium">{result.clipsCreated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID do Projeto:</span>
                    <span className="font-mono text-xs">{result.projectId?.slice(0, 12)}...</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleNewImport}>
                  Nova Importação
                </Button>
                <Button onClick={handleFinish}>
                  Abrir no Editor
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
