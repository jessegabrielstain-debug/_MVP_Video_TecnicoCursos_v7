
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Film, Activity, Layers, Palette, 
  Play, Pause, Settings, Download,
  Sparkles, Zap, TrendingUp, Target,
  ArrowLeft, Maximize2, Eye, BarChart3
} from 'lucide-react';
import Link from 'next/link';

// Import dos componentes principais
import AdvancedTimelineEditor from '@/components/timeline-professional/advanced-timeline-editor';
import KeyframeAnimationSystem from '@/components/timeline-professional/keyframe-animation-system';
import AudioSyncIASystem from '@/components/timeline-professional/audio-sync-ia-system';
import MotionGraphicsAIEngine from '@/components/timeline-professional/motion-graphics-ai-engine';

type ModuleId = 'timeline' | 'keyframes' | 'audio' | 'motion';

interface ModuleConfig {
  id: ModuleId;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
  component: React.ComponentType;
}

const TimelineMultiTrackProfessional = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('timeline');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const modules: ModuleConfig[] = [
    {
      id: 'timeline',
      name: 'Advanced Timeline',
      icon: <Film className="w-5 h-5" />,
      description: 'Editor timeline profissional multi-track',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20 border-blue-400/30',
      component: AdvancedTimelineEditor
    },
    {
      id: 'keyframes',
      name: 'Keyframe System',
      icon: <Target className="w-5 h-5" />,
      description: 'Sistema avançado de animação por keyframes',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20 border-purple-400/30',
      component: KeyframeAnimationSystem
    },
    {
      id: 'audio',
      name: 'Audio Sync IA',
      icon: <Activity className="w-5 h-5" />,
      description: 'Sincronização automática de áudio com IA',
      color: 'text-green-400',
      bgColor: 'bg-green-900/20 border-green-400/30',
      component: AudioSyncIASystem
    },
    {
      id: 'motion',
      name: 'Motion Graphics',
      icon: <Palette className="w-5 h-5" />,
      description: 'Engine de motion graphics com IA generativa',
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20 border-orange-400/30',
      component: MotionGraphicsAIEngine
    }
  ];

  const moduleIds: ModuleId[] = modules.map((module) => module.id);

  const isModuleId = (value: string): value is ModuleId => {
    return moduleIds.includes(value as ModuleId);
  };

  const currentModule = modules.find(m => m.id === activeModule);
  const ActiveComponent = currentModule?.component;

  const handleModuleSwitch = useCallback((moduleId: ModuleId) => {
    setActiveModule(moduleId);
  }, []);

  const renderOverview = () => (
    <div className="p-6 space-y-6">
      {/* Header Overview */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Film className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Timeline Multi-Track Professional</h1>
          <Badge variant="outline" className="border-purple-400 text-purple-400">
            <Sparkles className="w-4 h-4 mr-1" />
            AI Enhanced
          </Badge>
        </div>
        <p className="text-gray-300 max-w-3xl mx-auto">
          Sistema profissional de edição multi-track com inteligência artificial para criação de vídeos de treinamento NR. 
          Inclui timeline avançado, animações keyframe, sincronização automática de áudio e motion graphics IA.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 border-blue-400/30">
          <CardContent className="p-4 text-center">
            <Film className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">4</div>
            <div className="text-sm text-blue-300">Tracks de Vídeo</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-900/50 to-green-800/30 border-green-400/30">
          <CardContent className="p-4 text-center">
            <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">8</div>
            <div className="text-sm text-green-300">Canais de Áudio</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-900/50 to-purple-800/30 border-purple-400/30">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">∞</div>
            <div className="text-sm text-purple-300">Keyframes</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-900/50 to-orange-800/30 border-orange-400/30">
          <CardContent className="p-4 text-center">
            <Palette className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">50+</div>
            <div className="text-sm text-orange-300">Efeitos IA</div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modules.map((module) => (
          <Card 
            key={module.id} 
            className={`${module.bgColor} hover:scale-105 transition-transform duration-200 cursor-pointer`}
            onClick={() => handleModuleSwitch(module.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className={module.color}>{module.icon}</div>
                <span className="text-white">{module.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">{module.description}</p>
              
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`${module.color} border-current`}>
                  Professional
                </Badge>
                <Button 
                  size="sm" 
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModuleSwitch(module.id);
                  }}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Abrir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Highlights */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Recursos IA Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <Zap className="w-4 h-4" />
                <span className="font-semibold">Auto Sincronização</span>
              </div>
              <p className="text-sm text-gray-300">
                IA sincroniza automaticamente áudio e vídeo com precisão de 94.2%
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">Otimização Inteligente</span>
              </div>
              <p className="text-sm text-gray-300">
                Algoritmos IA otimizam timeline para máximo engajamento
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-400">
                <Palette className="w-4 h-4" />
                <span className="font-semibold">Motion Graphics IA</span>
              </div>
              <p className="text-sm text-gray-300">
                Geração automática de animações e efeitos visuais
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Button 
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => handleModuleSwitch('timeline')}
        >
          <Film className="w-5 h-5 mr-2" />
          Iniciar Timeline Editor
        </Button>
        
        <Button 
          size="lg"
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
          onClick={() => handleModuleSwitch('motion')}
        >
          <Palette className="w-5 h-5 mr-2" />
          Motion Graphics IA
        </Button>
      </div>
    </div>
  );

  if (activeModule === 'timeline' && ActiveComponent) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col">
        {/* Module Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveModule('timeline')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <div className={currentModule?.color}>{currentModule?.icon}</div>
              <h2 className="text-lg font-semibold text-white">{currentModule?.name}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Module Switcher */}
            <div className="flex gap-1">
              {modules.map((module) => (
                <Button
                  key={module.id}
                  variant={activeModule === module.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleModuleSwitch(module.id)}
                  className={`${activeModule === module.id ? `${module.color} bg-white/10` : 'text-gray-400'}`}
                >
                  {module.icon}
                </Button>
              ))}
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-gray-400 hover:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Active Component */}
        <div className="flex-1 overflow-hidden">
          <ActiveComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Navigation */}
      <div className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Link 
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          
          <Separator orientation="vertical" className="h-6" />
          
          <h1 className="text-xl font-bold text-white">Timeline Professional</h1>
          <Badge variant="outline" className="border-blue-400 text-blue-400">
            Sprint 24
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Settings className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Download className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto">
        {activeModule === 'timeline' ? renderOverview() : (
          <Tabs
            value={activeModule}
            onValueChange={(value) => {
              if (isModuleId(value)) {
                handleModuleSwitch(value);
              }
            }}
            className="h-[calc(100vh-80px)]"
          >
            <TabsList className="w-full bg-gray-800/50 border-b border-gray-700">
              {modules.map((module) => (
                <TabsTrigger 
                  key={module.id} 
                  value={module.id} 
                  className="flex-1 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                >
                  <div className="flex items-center gap-2">
                    <div className={module.color}>{module.icon}</div>
                    <span className="hidden sm:block">{module.name}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {modules.map((module) => (
              <TabsContent key={module.id} value={module.id} className="h-[calc(100vh-160px)] mt-0">
                <module.component />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default TimelineMultiTrackProfessional;
