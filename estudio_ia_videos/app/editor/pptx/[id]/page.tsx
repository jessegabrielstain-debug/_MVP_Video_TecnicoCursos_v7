'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  Download,
  Eye,
  EyeOff,
  Layers,
  Clock,
  Zap,
  Sparkles,
  Image as ImageIcon,
  Type,
  Mic,
  Video,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Save,
  Share2,
  Trash2,
  Copy,
  Edit3,
  CheckCircle,
  AlertCircle,
  Loader2,
  Target,
  Grid,
  Maximize,
  Minimize,
  RefreshCw,
  Database,
  Cloud,
  Cpu,
  HardDrive
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Types
interface PPTXSlide {
  id: string;
  slideNumber: number;
  title: string;
  content: string;
  notes?: string;
  duration: number;
  thumbnail?: string;
  animations?: Animation[];
  transitions?: Transition[];
  voiceOver?: VoiceOverSettings;
}

interface Animation {
  id: string;
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'bounce';
  element: string;
  delay: number;
  duration: number;
  easing: string;
}

interface Transition {
  id: string;
  type: 'fade' | 'slide' | 'push' | 'wipe' | 'dissolve';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

interface VoiceOverSettings {
  enabled: boolean;
  voice: 'male' | 'female' | 'neutral';
  speed: number;
  pitch: number;
  volume: number;
  language: 'pt-BR' | 'en-US' | 'es-ES';
}

interface PPTXProject {
  id: string;
  name: string;
  description: string;
  slides: PPTXSlide[];
  totalDuration: number;
  status: 'draft' | 'processing' | 'ready' | 'rendering' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
}

interface ProjectSettings {
  resolution: '720p' | '1080p' | '1440p' | '4K';
  frameRate: 24 | 30 | 60;
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  format: 'mp4' | 'webm' | 'mov';
  autoNarration: boolean;
  backgroundMusic: boolean;
  watermark: boolean;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  file?: File;
  error?: string;
  result?: any;
}

// Mock data
const mockProject: PPTXProject = {
  id: 'project-1',
  name: 'Treinamento NR-35 - Trabalho em Altura',
  description: 'Curso completo sobre normas de segurança para trabalho em altura',
  slides: [
    {
      id: 'slide-1',
      slideNumber: 1,
      title: 'Introdução à NR-35',
      content: 'Bem-vindos ao curso de Trabalho em Altura. Neste treinamento, você aprenderá sobre as principais normas de segurança.',
      duration: 8,
      thumbnail: '/api/placeholder/300/200',
      voiceOver: {
        enabled: true,
        voice: 'female',
        speed: 1.0,
        pitch: 1.0,
        volume: 0.8,
        language: 'pt-BR'
      }
    },
    {
      id: 'slide-2',
      slideNumber: 2,
      title: 'Equipamentos de Proteção Individual',
      content: 'Os EPIs são fundamentais para garantir a segurança do trabalhador. Conheça os principais equipamentos.',
      duration: 12,
      thumbnail: '/api/placeholder/300/200',
      voiceOver: {
        enabled: true,
        voice: 'female',
        speed: 1.0,
        pitch: 1.0,
        volume: 0.8,
        language: 'pt-BR'
      }
    },
    {
      id: 'slide-3',
      slideNumber: 3,
      title: 'Procedimentos de Segurança',
      content: 'Antes de iniciar qualquer trabalho em altura, é essencial seguir os procedimentos de segurança estabelecidos.',
      duration: 10,
      thumbnail: '/api/placeholder/300/200',
      voiceOver: {
        enabled: true,
        voice: 'female',
        speed: 1.0,
        pitch: 1.0,
        volume: 0.8,
        language: 'pt-BR'
      }
    }
  ],
  totalDuration: 30,
  status: 'ready',
  createdAt: new Date(),
  updatedAt: new Date(),
  settings: {
    resolution: '1080p',
    frameRate: 30,
    quality: 'high',
    format: 'mp4',
    autoNarration: true,
    backgroundMusic: false,
    watermark: true
  }
};

// Slide Component
const SlideCard: React.FC<{
  slide: PPTXSlide;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlay: () => void;
  onEdit: () => void;
}> = ({ slide, isSelected, isPlaying, onSelect, onPlay, onEdit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'border rounded-lg p-4 cursor-pointer transition-all',
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <img
            src={slide.thumbnail}
            alt={`Slide ${slide.slideNumber}`}
            className="w-24 h-16 object-cover rounded border"
          />
          <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {slide.slideNumber}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1 truncate">{slide.title}</h4>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{slide.content}</p>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{slide.duration}s</span>
            {slide.voiceOver?.enabled && (
              <>
                <Mic className="w-3 h-3 ml-2" />
                <span>Narração IA</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="p-1"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Upload Component
const PPTXUploader: React.FC<{
  onUploadComplete: (project: PPTXProject) => void;
}> = ({ onUploadComplete }) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('onDrop called with files:', acceptedFiles);
    const file = acceptedFiles[0];
    if (!file) {
      console.log('No file found in onDrop');
      return;
    }

    console.log('Starting upload process for:', file.name);
    setUploadState({ status: 'uploading', progress: 0, file });

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadState(prev => ({ ...prev, progress: i }));
      }

      setUploadState(prev => ({ ...prev, status: 'processing' }));
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadState(prev => ({ ...prev, status: 'complete' }));
      
      toast.success('PPTX processado com sucesso!');
      onUploadComplete(mockProject);
      
    } catch (error) {
      setUploadState({
        status: 'error',
        progress: 0,
        file,
        error: 'Erro ao processar arquivo'
      });
      toast.error('Erro ao processar PPTX');
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    disabled: uploadState.status === 'uploading' || uploadState.status === 'processing'
  });

  if (uploadState.status === 'complete') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Concluído!</h3>
          <p className="text-gray-600 mb-4">
            Seu arquivo PPTX foi processado com sucesso
          </p>
          <Button onClick={() => setUploadState({ status: 'idle', progress: 0 })}>
            Fazer Novo Upload
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
            (uploadState.status === 'uploading' || uploadState.status === 'processing') && 'pointer-events-none opacity-50'
          )}
        >
          <input {...getInputProps()} />
          
          {uploadState.status === 'idle' && (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? 'Solte o arquivo aqui' : 'Faça upload do seu PPTX'}
              </h3>
              <p className="text-gray-600 mb-4">
                Arraste e solte ou clique para selecionar um arquivo .pptx
              </p>
              <Button>Selecionar Arquivo</Button>
            </>
          )}
          
          {uploadState.status === 'uploading' && (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Fazendo Upload...</h3>
              <Progress value={uploadState.progress} className="w-full max-w-xs mx-auto mb-2" />
              <p className="text-sm text-gray-600">{uploadState.progress}% concluído</p>
            </>
          )}
          
          {uploadState.status === 'processing' && (
            <>
              <Cpu className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Processando PPTX...</h3>
              <p className="text-gray-600">Extraindo slides e conteúdo</p>
            </>
          )}
          
          {uploadState.status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro no Upload</h3>
              <p className="text-red-600 mb-4">{uploadState.error}</p>
              <Button onClick={() => setUploadState({ status: 'idle', progress: 0 })}>
                Tentar Novamente
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function PPTXStudio() {
  const [currentProject, setCurrentProject] = useState<PPTXProject | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null);
  const [playingSlide, setPlayingSlide] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  const handleUploadComplete = useCallback((project: PPTXProject) => {
    setCurrentProject(project);
    setShowUploader(false);
    setSelectedSlide(project.slides[0]?.id || null);
    toast.success('Projeto PPTX carregado com sucesso!');
  }, []);

  const handleSlideSelect = useCallback((slideId: string) => {
    setSelectedSlide(slideId);
    setPlayingSlide(null);
  }, []);

  const handleSlidePlay = useCallback((slideId: string) => {
    setPlayingSlide(playingSlide === slideId ? null : slideId);
  }, [playingSlide]);

  const handleSlideEdit = useCallback((slideId: string) => {
    toast.info(`Editando slide ${slideId}`);
  }, []);

  const handleExportToTimeline = useCallback(() => {
    if (currentProject) {
      toast.success('Exportando para Timeline Editor...');
      // Here we would integrate with the timeline editor
    }
  }, [currentProject]);

  const selectedSlideData = currentProject?.slides.find(s => s.id === selectedSlide);

  if (showUploader || !currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/editor">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  PPTX Studio
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Converta apresentações em vídeos profissionais
                </p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="max-w-2xl mx-auto">
            <PPTXUploader onUploadComplete={handleUploadComplete} />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Processamento Automático</h3>
                <p className="text-sm text-gray-600">
                  Extração inteligente de slides, textos e imagens
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Mic className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Narração IA</h3>
                <p className="text-sm text-gray-600">
                  Geração automática de áudio com vozes naturais
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Video className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Renderização Profissional</h3>
                <p className="text-sm text-gray-600">
                  Vídeos em alta qualidade com transições suaves
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/editor">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">PPTX Studio</h1>
              <p className="text-sm text-gray-400">{currentProject.name}</p>
            </div>
            <Badge variant="secondary">
              {currentProject.slides.length} slides • {currentProject.totalDuration}s
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowUploader(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Novo Upload
            </Button>
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Link href="/editor/timeline">
              <Button size="sm" onClick={handleExportToTimeline}>
                <Layers className="w-4 h-4 mr-2" />
                Exportar para Timeline
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Slides */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold mb-2">Slides</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FileText className="w-4 h-4" />
              <span>{currentProject.slides.length} slides</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>{currentProject.totalDuration}s</span>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {currentProject.slides.map((slide) => (
                <SlideCard
                  key={slide.id}
                  slide={slide}
                  isSelected={selectedSlide === slide.id}
                  isPlaying={playingSlide === slide.id}
                  onSelect={() => handleSlideSelect(slide.id)}
                  onPlay={() => handleSlidePlay(slide.id)}
                  onEdit={() => handleSlideEdit(slide.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          <div className="flex-1 bg-black flex items-center justify-center">
            {selectedSlideData ? (
              <div className="text-center max-w-4xl">
                <img
                  src={selectedSlideData.thumbnail}
                  alt={selectedSlideData.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">{selectedSlideData.title}</h3>
                  <p className="text-gray-300 text-sm">{selectedSlideData.content}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">Selecione um slide para visualizar</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="sm">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                {playingSlide ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="sm">
                <SkipForward className="w-4 h-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6 mx-4" />
              
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <Slider defaultValue={[80]} max={100} step={1} className="w-20" />
              </div>
              
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-gray-800 border-l border-gray-700">
          <Tabs defaultValue="slide" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 m-4">
              <TabsTrigger value="slide">Slide</TabsTrigger>
              <TabsTrigger value="voice">Voz</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="slide" className="p-4 space-y-4">
                {selectedSlideData ? (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Título</Label>
                      <Input 
                        value={selectedSlideData.title} 
                        className="mt-1"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Conteúdo</Label>
                      <Textarea 
                        value={selectedSlideData.content} 
                        className="mt-1 h-24"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Duração (segundos)</Label>
                      <Input 
                        type="number" 
                        value={selectedSlideData.duration} 
                        className="mt-1"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">
                      Selecione um slide para editar
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="voice" className="p-4 space-y-4">
                {selectedSlideData?.voiceOver ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Narração IA</Label>
                      <Switch checked={selectedSlideData.voiceOver.enabled} />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Voz</Label>
                      <select className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded">
                        <option value="female">Feminina</option>
                        <option value="male">Masculina</option>
                        <option value="neutral">Neutra</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Velocidade</Label>
                      <Slider 
                        defaultValue={[selectedSlideData.voiceOver.speed * 100]} 
                        max={200} 
                        min={50} 
                        step={10} 
                        className="mt-2" 
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Volume</Label>
                      <Slider 
                        defaultValue={[selectedSlideData.voiceOver.volume * 100]} 
                        max={100} 
                        step={5} 
                        className="mt-2" 
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Mic className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">
                      Configurações de voz não disponíveis
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="export" className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Resolução</Label>
                  <select className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded">
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="1440p">1440p (2K)</option>
                    <option value="4K">4K (Ultra HD)</option>
                  </select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Qualidade</Label>
                  <select className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded">
                    <option value="draft">Rascunho</option>
                    <option value="standard">Padrão</option>
                    <option value="high">Alta</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Formato</Label>
                  <select className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded">
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                    <option value="mov">MOV</option>
                  </select>
                </div>
                
                <Separator />
                
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Renderizar Vídeo
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}