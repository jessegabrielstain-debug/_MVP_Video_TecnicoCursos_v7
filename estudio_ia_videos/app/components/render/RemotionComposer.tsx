/**
 * 🎬 Remotion Composer - Timeline to React Composition Converter
 * Converts timeline data to Remotion-compatible React compositions
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Code2, 
  Play, 
  Eye, 
  Download, 
  Layers, 
  Zap, 
  Settings, 
  FileCode, 
  Cpu, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
  Film,
  Type,
  Image as ImageIcon,
  Volume2,
  Square,
  RotateCw,
  Move,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import type { TimelineProject, TimelineElement } from '@/types/advanced-editor';

// Remotion Composition Types
interface RemotionComposition {
  id: string;
  component: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  props: Record<string, unknown>;
}

interface RemotionSequence {
  from: number;
  durationInFrames: number;
  component: string;
  props: Record<string, unknown>;
}

interface GeneratedCode {
  id: string;
  name: string;
  language: 'jsx' | 'typescript';
  content: string;
  type: 'composition' | 'component' | 'utility';
}

interface RemotionComposerProps {
  project?: TimelineProject;
  onCompositionGenerated?: (composition: RemotionComposition, code: GeneratedCode[]) => void;
}

export default function RemotionComposer({ 
  project,
  onCompositionGenerated
}: RemotionComposerProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedComposition, setGeneratedComposition] = useState<RemotionComposition | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'code' | 'export'>('overview');

  // Convert timeline element to Remotion props
  const convertElementToRemotionProps = useCallback((element: TimelineElement) => {
    const baseProps = {
      id: element.id,
      name: element.name,
      startTime: element.startTime,
      duration: element.duration,
      visible: element.visible,
      opacity: element.opacity,
      transform: element.transform,
      layer: element.layer
    };

    switch (element.type) {
      case 'text':
        return {
          ...baseProps,
          type: 'text',
          text: element.properties.text?.content || 'Sample Text',
          fontSize: element.properties.text?.font.size || 32,
          fontWeight: element.properties.text?.font.weight || 400,
          color: element.properties.text?.style.fill || '#ffffff',
          fontFamily: element.properties.text?.font.family || 'Inter'
        };

      case 'image':
        return {
          ...baseProps,
          type: 'image',
          src: element.properties.media?.source.url || '/placeholder-image.jpg',
          fit: 'contain'
        };

      case 'video':
        return {
          ...baseProps,
          type: 'video',
          src: element.properties.media?.source.url || '/placeholder-video.mp4',
          volume: element.properties.audio?.volume || 1
        };

      case 'shape':
        return {
          ...baseProps,
          type: 'shape',
          shape: element.properties.shape?.type || 'rectangle',
          fill: element.properties.shape?.fill || '#3b82f6',
          width: element.properties.shape?.path || 200,
          height: element.properties.shape?.path || 200,
          borderRadius: element.properties.shape?.cornerRadius || 0
        };

      case 'audio':
        return {
          ...baseProps,
          type: 'audio',
          src: element.properties.audio?.source.url || '/placeholder-audio.mp3',
          volume: element.properties.audio?.volume || 1
        };

      default:
        return baseProps;
    }
  }, []);

  // Generate React component code for timeline element
  const generateElementComponent = useCallback((element: TimelineElement): string => {
    const props = convertElementToRemotionProps(element);
    
    switch (element.type) {
      case 'text':
        return `
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface ${element.id}Props {
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  opacity: number;
  transform: any;
}

export const ${element.id}: React.FC<${element.id}Props> = ({
  text,
  fontSize,
  color,
  fontFamily,
  opacity,
  transform
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const animatedOpacity = interpolate(
    frame,
    [0, 30, ${Math.floor(element.duration * (project?.settings.fps || 30)) - 30}, ${Math.floor(element.duration * (project?.settings.fps || 30))}],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontSize,
        color,
        fontFamily,
        opacity: animatedOpacity * opacity,
        transform: \`translate3d(\${transform.position.x}px, \${transform.position.y}px, \${transform.position.z}px) 
                   rotateX(\${transform.rotation.x}deg) rotateY(\${transform.rotation.y}deg) rotateZ(\${transform.rotation.z}deg) 
                   scale3d(\${transform.scale.x}, \${transform.scale.y}, \${transform.scale.z})\`
      }}
    >
      {text}
    </AbsoluteFill>
  );
};`;

      case 'image':
        return `
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';

interface ${element.id}Props {
  src: string;
  opacity: number;
  transform: any;
}

export const ${element.id}: React.FC<${element.id}Props> = ({
  src,
  opacity,
  transform
}) => {
  const frame = useCurrentFrame();
  
  const animatedOpacity = interpolate(
    frame,
    [0, 30],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        opacity: animatedOpacity * opacity,
        transform: \`translate3d(\${transform.position.x}px, \${transform.position.y}px, \${transform.position.z}px) 
                   rotateX(\${transform.rotation.x}deg) rotateY(\${transform.rotation.y}deg) rotateZ(\${transform.rotation.z}deg) 
                   scale3d(\${transform.scale.x}, \${transform.scale.y}, \${transform.scale.z})\`
      }}
    >
      <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </AbsoluteFill>
  );
};`;

      case 'shape':
        return `
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface ${element.id}Props {
  fill: string;
  width: number;
  height: number;
  borderRadius: number;
  opacity: number;
  transform: any;
}

export const ${element.id}: React.FC<${element.id}Props> = ({
  fill,
  width,
  height,
  borderRadius,
  opacity,
  transform
}) => {
  const frame = useCurrentFrame();
  
  const animatedScale = interpolate(
    frame,
    [0, 30],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        transform: \`translate3d(\${transform.position.x}px, \${transform.position.y}px, \${transform.position.z}px) 
                   rotateX(\${transform.rotation.x}deg) rotateY(\${transform.rotation.y}deg) rotateZ(\${transform.rotation.z}deg) 
                   scale3d(\${transform.scale.x * animatedScale}, \${transform.scale.y * animatedScale}, \${transform.scale.z})\`
      }}
    >
      <div
        style={{
          width,
          height,
          backgroundColor: fill,
          borderRadius
        }}
      />
    </AbsoluteFill>
  );
};`;

      default:
        return `// Component for ${element.type} not implemented yet`;
    }
  }, [project, convertElementToRemotionProps]);

  // Generate main composition code
  const generateMainComposition = useCallback((): string => {
    if (!project) return '';

    const elements = project.elements;
    const durationInFrames = Math.ceil(project.settings.duration * project.settings.fps);

    const imports = elements.map(el => `import { ${el.id} } from './components/${el.id}';`).join('\n');
    
    const sequences = elements.map(el => {
      const startFrame = Math.floor(el.startTime * project.settings.fps);
      const elementDurationInFrames = Math.floor(el.duration * project.settings.fps);
      const props = convertElementToRemotionProps(el);
      
      return `      <Sequence from={${startFrame}} durationInFrames={${elementDurationInFrames}}>
        <${el.id}
          {...${JSON.stringify(props, null, 10).replace(/"/g, '')}}
        />
      </Sequence>`;
    }).join('\n');

    return `
import React from 'react';
import { AbsoluteFill, Composition, Sequence } from 'remotion';
${imports}

const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '${project.settings.background?.color || '#000000'}' }}>
${sequences}
    </AbsoluteFill>
  );
};

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="${project.id}"
        component={MainComposition}
        durationInFrames={${durationInFrames}}
        fps={${project.settings.fps}}
        width={${project.settings.width}}
        height={${project.settings.height}}
      />
    </>
  );
};`;
  }, [project, convertElementToRemotionProps]);

  // Generate composition
  const generateComposition = useCallback(async () => {
    if (!project) {
      toast({
        title: "Erro",
        description: "Projeto não encontrado",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate generation process
      const steps = [
        'Analisando elementos da timeline...',
        'Convertendo propriedades...',
        'Gerando componentes React...',
        'Criando composição principal...',
        'Otimizando código...',
        'Finalizando...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setGenerationProgress(((i + 1) / steps.length) * 100);
        
        toast({
          title: "Gerando composição",
          description: steps[i]
        });
      }

      // Generate code files
      const codeFiles: GeneratedCode[] = [];

      // Main composition
      codeFiles.push({
        id: 'main-composition',
        name: 'RemotionVideo.tsx',
        language: 'typescript',
        content: generateMainComposition(),
        type: 'composition'
      });

      // Individual element components
      project.elements.forEach(element => {
        codeFiles.push({
          id: `component-${element.id}`,
          name: `${element.id}.tsx`,
          language: 'typescript',
          content: generateElementComponent(element),
          type: 'component'
        });
      });

      // Package.json for Remotion
      codeFiles.push({
        id: 'package-json',
        name: 'package.json',
        language: 'typescript',
        content: JSON.stringify({
          name: `${project.name.toLowerCase().replace(/\s+/g, '-')}-video`,
          version: '1.0.0',
          description: `Generated Remotion composition for ${project.name}`,
          scripts: {
            build: 'remotion render RemotionVideo out/video.mp4',
            preview: 'remotion preview',
            dev: 'remotion studio'
          },
          dependencies: {
            '@remotion/cli': '^4.0.0',
            '@remotion/renderer': '^4.0.0',
            'remotion': '^4.0.0',
            'react': '^18.0.0',
            'react-dom': '^18.0.0'
          }
        }, null, 2),
        type: 'utility'
      });

      // Create composition object
      const composition: RemotionComposition = {
        id: project.id,
        component: 'MainComposition',
        durationInFrames: Math.ceil(project.settings.duration * project.settings.fps),
        fps: project.settings.fps,
        width: project.settings.width,
        height: project.settings.height,
        props: {}
      };

      setGeneratedComposition(composition);
      setGeneratedCode(codeFiles);

      toast({
        title: "Composição gerada",
        description: `${codeFiles.length} arquivos gerados com sucesso`
      });

      if (onCompositionGenerated) {
        onCompositionGenerated(composition, codeFiles);
      }

    } catch (error) {
      toast({
        title: "Erro na geração",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [project, generateMainComposition, generateElementComponent, toast, onCompositionGenerated]);

  // Copy code to clipboard
  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copiado",
        description: "Código copiado para a área de transferência"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar código",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Project stats
  const projectStats = useMemo(() => {
    if (!project) return null;
    
    return {
      elements: project.elements.length,
      duration: project.settings.duration,
      tracks: project.tracks.length,
      resolution: `${project.settings.width}x${project.settings.height}`,
      fps: project.settings.fps
    };
  }, [project]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Remotion Composer</h1>
                <p className="text-gray-400">Timeline to React Composition Converter</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                <FileCode className="mr-1 h-3 w-3" />
                React + TS
              </Badge>
              
              {generatedComposition && (
                <Badge variant="outline" className="border-green-500 text-green-400">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Generated
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={generateComposition}
              disabled={!project || isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Gerar Composição
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="mt-4">
            <Progress value={generationProgress} className="h-2" />
            <p className="text-sm text-gray-400 mt-1">
              Gerando composição Remotion... {Math.round(generationProgress)}%
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'preview' | 'code' | 'export')} className="h-full">
          {/* Tabs Navigation */}
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <TabsList className="bg-gray-700">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className="flex items-center gap-2"
                disabled={!generatedComposition}
              >
                <Play className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger 
                value="code" 
                className="flex items-center gap-2"
                disabled={generatedCode.length === 0}
              >
                <Code2 className="h-4 w-4" />
                Código ({generatedCode.length})
              </TabsTrigger>
              <TabsTrigger 
                value="export" 
                className="flex items-center gap-2"
                disabled={!generatedComposition}
              >
                <Download className="h-4 w-4" />
                Export
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Informações do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-400">Nome</Label>
                        <p className="font-medium">{project.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-400">Elementos</Label>
                          <p className="font-medium">{projectStats?.elements}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">Duração</Label>
                          <p className="font-medium">{projectStats?.duration}s</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-400">Resolução</Label>
                          <p className="font-medium">{projectStats?.resolution}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">FPS</Label>
                          <p className="font-medium">{projectStats?.fps}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p>Nenhum projeto carregado</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Elements Overview */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Elementos da Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project && project.elements.length > 0 ? (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {project.elements.map((element) => (
                          <div
                            key={element.id}
                            className="flex items-center gap-3 p-3 rounded bg-gray-700"
                          >
                            {element.type === 'text' && <Type className="h-4 w-4 text-green-400" />}
                            {element.type === 'image' && <ImageIcon className="h-4 w-4 text-blue-400" />}
                            {element.type === 'video' && <Film className="h-4 w-4 text-purple-400" />}
                            {element.type === 'audio' && <Volume2 className="h-4 w-4 text-orange-400" />}
                            {element.type === 'shape' && <Square className="h-4 w-4 text-pink-400" />}
                            
                            <div className="flex-1">
                              <p className="text-sm font-medium">{element.name}</p>
                              <p className="text-xs text-gray-400">
                                {element.startTime}s - {element.startTime + element.duration}s
                              </p>
                            </div>
                            
                            <Badge variant="secondary" className="text-xs">
                              {element.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum elemento encontrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Generation Status */}
            {generatedComposition && (
              <Card className="bg-gray-800 border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Composição Gerada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-400">Componente</Label>
                      <p className="font-medium">{generatedComposition.component}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Frames</Label>
                      <p className="font-medium">{generatedComposition.durationInFrames}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Resolução</Label>
                      <p className="font-medium">{generatedComposition.width}x{generatedComposition.height}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Arquivos</Label>
                      <p className="font-medium">{generatedCode.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="p-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Preview da Composição</CardTitle>
                <CardDescription>
                  Visualização da composição Remotion gerada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-20 text-gray-400">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Preview Remotion</h3>
                  <p className="mb-4">Preview interativo em desenvolvimento</p>
                  <p className="text-sm">
                    Use <code className="bg-gray-700 px-2 py-1 rounded">remotion studio</code> para preview completo
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="p-6">
            <div className="space-y-4">
              {generatedCode.map((file) => (
                <Card key={file.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileCode className="h-5 w-5" />
                        {file.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {file.type}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(file.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <pre className="text-xs bg-gray-900 p-4 rounded overflow-x-auto">
                        <code>{file.content}</code>
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="p-6">
            <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Exportar Composição</CardTitle>
                <CardDescription>
                  Baixe os arquivos da composição Remotion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Download className="h-4 w-4" />
                  <AlertDescription>
                    A composição foi gerada com sucesso. Use os comandos abaixo para renderizar o vídeo final.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">1. Instalar dependências</Label>
                    <div className="bg-gray-900 p-3 rounded mt-2">
                      <code className="text-sm">npm install</code>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">2. Preview no browser</Label>
                    <div className="bg-gray-900 p-3 rounded mt-2">
                      <code className="text-sm">npm run dev</code>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">3. Renderizar vídeo</Label>
                    <div className="bg-gray-900 p-3 rounded mt-2">
                      <code className="text-sm">npm run build</code>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Projeto
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir no CodeSandbox
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}