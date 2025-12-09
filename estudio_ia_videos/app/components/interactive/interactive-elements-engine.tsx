
'use client';

import React, { useState, useRef } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MousePointer,
  HelpCircle,
  Target,
  Play,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Award,
  Clock,
  Users,
  BarChart3,
  Sparkles,
  Zap,
  GamepadIcon,
  CircleDot,
  MapPin,
  Eye
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface InteractiveElement {
  id: string;
  type: 'quiz' | 'hotspot' | 'button' | 'form';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  trigger: 'click' | 'hover' | 'time';
  triggerTime?: number;
  content: QuizContent | HotspotContent | ButtonContent | FormContent;
  enabled: boolean;
}

interface QuizContent {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

interface HotspotContent {
  title: string;
  description: string;
  mediaUrl?: string;
  animation: 'pulse' | 'bounce' | 'none';
}

interface ButtonContent {
  label: string;
  action: 'navigate' | 'popup' | 'download';
  target: string;
  style: 'primary' | 'secondary' | 'warning';
}

interface FormContent {
  fields: FormField[];
  submitAction: string;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

export default function InteractiveElementsEngine() {
  const [elements, setElements] = useState<InteractiveElement[]>([
    {
      id: 'quiz1',
      type: 'quiz',
      title: 'Quiz NR-12: Segurança em Máquinas',
      x: 150,
      y: 200,
      width: 320,
      height: 240,
      trigger: 'time',
      triggerTime: 15,
      content: {
        question: 'Qual é o principal objetivo da NR-12?',
        options: [
          'Aumentar a produtividade das máquinas',
          'Garantir a segurança e saúde dos trabalhadores',
          'Reduzir custos de manutenção',
          'Melhorar a qualidade dos produtos'
        ],
        correctAnswer: 1,
        explanation: 'A NR-12 tem como principal objetivo garantir a segurança e saúde dos trabalhadores que interagem com máquinas e equipamentos.',
        points: 10
      },
      enabled: true
    },
    {
      id: 'hotspot1',
      type: 'hotspot',
      title: 'Ponto de Atenção - Proteção',
      x: 400,
      y: 150,
      width: 60,
      height: 60,
      trigger: 'hover',
      content: {
        title: 'Proteção de Emergência',
        description: 'Este botão de emergência deve estar sempre acessível e claramente identificado para interromper o funcionamento da máquina em situações de risco.',
        animation: 'pulse'
      },
      enabled: true
    },
    {
      id: 'button1',
      type: 'button',
      title: 'Botão Certificado',
      x: 600,
      y: 300,
      width: 180,
      height: 50,
      trigger: 'click',
      content: {
        label: 'Baixar Certificado NR-12',
        action: 'download',
        target: '/certificates/nr12-certificate.pdf',
        style: 'primary'
      },
      enabled: true
    },
    {
      id: 'form1',
      type: 'form',
      title: 'Avaliação de Conhecimento',
      x: 50,
      y: 400,
      width: 300,
      height: 200,
      trigger: 'click',
      content: {
        fields: [
          { id: 'name', label: 'Nome Completo', type: 'text', required: true },
          { id: 'email', label: 'E-mail', type: 'email', required: true },
          { id: 'experience', label: 'Experiência com NRs', type: 'select', required: true, options: ['Iniciante', 'Intermediário', 'Avançado'] },
          { id: 'comments', label: 'Comentários', type: 'textarea', required: false }
        ],
        submitAction: '/api/v1/interactive/submit-form'
      },
      enabled: true
    }
  ]);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewStats, setPreviewStats] = useState({
    interactions: 47,
    completionRate: 82,
    averageTime: 145,
    engagementScore: 94
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Add new interactive element
  const addElement = (type: InteractiveElement['type']) => {
    const newElement: InteractiveElement = {
      id: `element_${Date.now()}`,
      type,
      title: `Novo ${type === 'quiz' ? 'Quiz' : 
                   type === 'hotspot' ? 'Hotspot' : 
                   type === 'button' ? 'Botão' : 'Formulário'}`,
      x: 100,
      y: 100,
      width: type === 'quiz' ? 320 : type === 'hotspot' ? 60 : type === 'button' ? 180 : 300,
      height: type === 'quiz' ? 240 : type === 'hotspot' ? 60 : type === 'button' ? 50 : 200,
      trigger: 'click',
      content: type === 'quiz' ? {
        question: 'Pergunta do quiz...',
        options: ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'],
        correctAnswer: 0,
        explanation: 'Explicação da resposta...',
        points: 5
      } : type === 'hotspot' ? {
        title: 'Título do hotspot',
        description: 'Descrição do hotspot...',
        animation: 'pulse'
      } : type === 'button' ? {
        label: 'Clique aqui',
        action: 'popup',
        target: '',
        style: 'primary'
      } : {
        fields: [
          { id: 'field1', label: 'Campo 1', type: 'text', required: true }
        ],
        submitAction: '/api/submit'
      },
      enabled: true
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    toast.success(`${type === 'quiz' ? 'Quiz' : type === 'hotspot' ? 'Hotspot' : type === 'button' ? 'Botão' : 'Formulário'} adicionado`);
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
    toast.success('Elemento removido');
  };

  // Handle element drag
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (isPreviewMode) return;
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    setIsDragging(true);
    setSelectedElement(elementId);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

      setElements(prev => prev.map(el => 
        el.id === selectedElement
          ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) }
          : el
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Export interactive elements
  const exportElements = async () => {
    const exportData = {
      elements,
      settings: {
        trackInteractions: true,
        showProgress: true,
        requireCompletion: false,
        gamification: true
      }
    };

    try {
      logger.info('Exporting interactive elements', { component: 'InteractiveElementsEngine', exportData });
      toast.success('Elementos interativos exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar elementos');
    }
  };

  const renderElementIcon = (type: InteractiveElement['type']) => {
    switch (type) {
      case 'quiz': return <HelpCircle className="w-4 h-4" />;
      case 'hotspot': return <Target className="w-4 h-4" />;
      case 'button': return <MousePointer className="w-4 h-4" />;
      case 'form': return <Edit3 className="w-4 h-4" />;
    }
  };

  const renderPreviewElement = (element: InteractiveElement) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      cursor: isPreviewMode ? 'pointer' : 'move'
    };

    switch (element.type) {
      case 'quiz':
        return (
          <div
            key={element.id}
            style={baseStyle}
            className={`bg-blue-500/90 border-2 border-blue-400 rounded-lg p-3 text-white ${!isPreviewMode && selectedElement === element.id ? 'ring-2 ring-blue-300' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
          >
            <HelpCircle className="w-5 h-5 mb-2" />
            <p className="text-sm font-medium truncate">{(element.content as QuizContent).question}</p>
            <Badge className="mt-2 bg-white/20">Quiz</Badge>
          </div>
        );

      case 'hotspot':
        return (
          <div
            key={element.id}
            style={baseStyle}
            className={`bg-yellow-500/90 border-2 border-yellow-400 rounded-full flex items-center justify-center text-white ${(element.content as HotspotContent).animation === 'pulse' ? 'animate-pulse' : (element.content as HotspotContent).animation === 'bounce' ? 'animate-bounce' : ''} ${!isPreviewMode && selectedElement === element.id ? 'ring-2 ring-yellow-300' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
          >
            <Target className="w-6 h-6" />
          </div>
        );

      case 'button':
        return (
          <div
            key={element.id}
            style={baseStyle}
            className={`${(element.content as ButtonContent).style === 'primary' ? 'bg-blue-500' : (element.content as ButtonContent).style === 'secondary' ? 'bg-gray-500' : 'bg-yellow-500'}/90 border-2 border-current rounded-lg flex items-center justify-center text-white font-medium ${!isPreviewMode && selectedElement === element.id ? 'ring-2 ring-blue-300' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
          >
            {(element.content as ButtonContent).label}
          </div>
        );

      case 'form':
        return (
          <div
            key={element.id}
            style={baseStyle}
            className={`bg-green-500/90 border-2 border-green-400 rounded-lg p-3 text-white ${!isPreviewMode && selectedElement === element.id ? 'ring-2 ring-green-300' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
          >
            <Edit3 className="w-5 h-5 mb-2" />
            <p className="text-sm font-medium">{element.title}</p>
            <Badge className="mt-2 bg-white/20">Formulário</Badge>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <GamepadIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Interactive Elements Engine
                  </h1>
                  <p className="text-sm text-muted-foreground">Sistema de elementos interativos e gamificação</p>
                </div>
              </div>
              <Badge variant="secondary" className="ml-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Gamification
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Preview</span>
                <Switch 
                  checked={isPreviewMode}
                  onCheckedChange={setIsPreviewMode}
                />
              </div>
              <Badge variant="outline" className="text-purple-600 border-purple-200">
                {elements.length} Elementos
              </Badge>
              <Button 
                onClick={exportElements}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Exportar Interatividade
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Canvas Area */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            {!isPreviewMode && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Adicionar elemento:</span>
                    <Button size="sm" variant="outline" onClick={() => addElement('quiz')}>
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Quiz
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addElement('hotspot')}>
                      <Target className="w-4 h-4 mr-2" />
                      Hotspot
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addElement('button')}>
                      <MousePointer className="w-4 h-4 mr-2" />
                      Botão
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addElement('form')}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Formulário
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interactive Canvas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isPreviewMode ? <Eye className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                  {isPreviewMode ? 'Modo Preview' : 'Canvas de Edição'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={canvasRef}
                  className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                  style={{ height: '600px' }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="grid grid-cols-20 grid-rows-15 h-full w-full">
                      {Array.from({ length: 300 }).map((_, i) => (
                        <div key={i} className="border border-gray-400" />
                      ))}
                    </div>
                  </div>

                  {/* Interactive Elements */}
                  {elements.filter(el => el.enabled).map(element => renderPreviewElement(element))}

                  {/* Guidelines */}
                  {!isPreviewMode && selectedElement && (
                    <>
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="w-full h-px bg-blue-300 absolute top-1/2" style={{ transform: 'translateY(-50%)' }} />
                        <div className="h-full w-px bg-blue-300 absolute left-1/2" style={{ transform: 'translateX(-50%)' }} />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Properties & Stats Panel */}
          <div className="space-y-6">
            
            {/* Stats Card */}
            {isPreviewMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analytics em Tempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Interação</span>
                      <span className="font-medium text-green-600">{previewStats.interactions}%</span>
                    </div>
                    <Progress value={previewStats.interactions} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Conclusão</span>
                      <span className="font-medium text-blue-600">{previewStats.completionRate}%</span>
                    </div>
                    <Progress value={previewStats.completionRate} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Engajamento</span>
                      <span className="font-medium text-purple-600">{previewStats.engagementScore}%</span>
                    </div>
                    <Progress value={previewStats.engagementScore} className="h-2" />
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Tempo Médio: {previewStats.averageTime}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Element Properties */}
            {!isPreviewMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Propriedades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedElement ? (
                    <div className="space-y-4">
                      {(() => {
                        const element = elements.find(el => el.id === selectedElement);
                        if (!element) return null;

                        return (
                          <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="general">Geral</TabsTrigger>
                              <TabsTrigger value="content">Conteúdo</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="general" className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Título</label>
                                <Input 
                                  value={element.title}
                                  onChange={(e) => {
                                    setElements(prev => prev.map(el => 
                                      el.id === selectedElement 
                                        ? { ...el, title: e.target.value }
                                        : el
                                    ));
                                  }}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-sm font-medium">X</label>
                                  <Input 
                                    type="number"
                                    value={element.x}
                                    onChange={(e) => {
                                      setElements(prev => prev.map(el => 
                                        el.id === selectedElement 
                                          ? { ...el, x: parseInt(e.target.value) || 0 }
                                          : el
                                      ));
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Y</label>
                                  <Input 
                                    type="number"
                                    value={element.y}
                                    onChange={(e) => {
                                      setElements(prev => prev.map(el => 
                                        el.id === selectedElement 
                                          ? { ...el, y: parseInt(e.target.value) || 0 }
                                          : el
                                      ));
                                    }}
                                  />
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="content" className="space-y-4">
                              {element.type === 'quiz' && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium">Pergunta</label>
                                    <Textarea 
                                      value={(element.content as QuizContent).question}
                                      onChange={(e) => {
                                        setElements(prev => prev.map(el => 
                                          el.id === selectedElement 
                                            ? { ...el, content: { ...el.content, question: e.target.value } }
                                            : el
                                        ));
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Pontos</label>
                                    <Input 
                                      type="number"
                                      value={(element.content as QuizContent).points}
                                      onChange={(e) => {
                                        setElements(prev => prev.map(el => 
                                          el.id === selectedElement 
                                            ? { ...el, content: { ...el.content, points: parseInt(e.target.value) || 0 } }
                                            : el
                                        ));
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Selecione um elemento para editar</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Elements List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircleDot className="w-5 h-5" />
                  Lista de Elementos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {elements.map((element) => (
                    <div 
                      key={element.id}
                      className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                        selectedElement === element.id 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' 
                          : 'border-border hover:border-purple-300'
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      <div className="flex items-center gap-2">
                        {renderElementIcon(element.type)}
                        <span className="text-sm font-medium truncate">{element.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {element.type}
                        </Badge>
                        {!isPreviewMode && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteElement(element.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
