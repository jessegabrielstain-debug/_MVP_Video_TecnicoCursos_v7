
/**
 * 🌍 Estúdio IA de Vídeos - Sprint 5
 * Studio de Ambientes 3D Imersivos
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Box,
  Eye,
  Settings,
  Users,
  Camera,
  Lightbulb,
  Sparkles,
  Download,
  Play,
  RotateCcw,
  Maximize,
  Smartphone,
  Monitor,
  Headphones,
  Star,
  Timer,
  Layers
} from 'lucide-react';

export default function EnvironmentStudio() {
  const [environments, setEnvironments] = useState<any[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'preview' | 'edit' | 'render'>('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [currentScene, setCurrentScene] = useState<any>(null);

  // Configurações de personalização
  const [lightingSettings, setLightingSettings] = useState({
    ambient: [0.5],
    directional: [0.7],
    shadows: true
  });

  const [cameraSettings, setCameraSettings] = useState({
    fov: [60],
    position: { x: 0, y: 5, z: 10 }
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    try {
      const response = await fetch('/api/3d-environments/list');
      const data = await response.json();
      setEnvironments(data);
      if (data.length > 0) {
        setSelectedEnvironment(data[0]);
      }
    } catch (error) {
      logger.error('Erro ao carregar ambientes', error instanceof Error ? error : new Error(String(error)), { component: 'EnvironmentStudio' });
      // Mock data para demonstração
      setEnvironments(mockEnvironments);
      setSelectedEnvironment(mockEnvironments[0]);
    }
  };

  const mockEnvironments = [
    {
      id: 'industrial-factory',
      name: 'Fábrica Industrial',
      description: 'Ambiente industrial completo com máquinas e equipamentos',
      category: 'industrial',
      previewImage: '/environments/previews/factory.jpg',
      compatibility: { mobile: true, desktop: true, vr: true, ar: false },
      performance: { complexity: 'high', polygonCount: 150000, loadTime: 8.5 },
      metadata: { rating: 4.8, downloads: 1247, tags: ['industrial', 'segurança', 'NR-12'] }
    },
    {
      id: 'construction-site',
      name: 'Canteiro de Obras',
      description: 'Canteiro de construção civil com equipamentos',
      category: 'construction',
      previewImage: '/environments/previews/construction.jpg',
      compatibility: { mobile: true, desktop: true, vr: true, ar: true },
      performance: { complexity: 'high', polygonCount: 200000, loadTime: 12.3 },
      metadata: { rating: 4.6, downloads: 892, tags: ['construção', 'NR-35', 'altura'] }
    },
    {
      id: 'modern-office',
      name: 'Escritório Moderno',
      description: 'Ambiente corporativo para treinamentos administrativos',
      category: 'office',
      previewImage: '/environments/previews/office.jpg',
      compatibility: { mobile: true, desktop: true, vr: false, ar: false },
      performance: { complexity: 'medium', polygonCount: 75000, loadTime: 4.2 },
      metadata: { rating: 4.7, downloads: 1567, tags: ['escritório', 'corporativo'] }
    },
    {
      id: 'virtual-classroom',
      name: 'Sala de Aula Virtual',
      description: 'Ambiente educacional futurista',
      category: 'virtual',
      previewImage: '/environments/previews/classroom.jpg',
      compatibility: { mobile: true, desktop: true, vr: true, ar: true },
      performance: { complexity: 'low', polygonCount: 45000, loadTime: 2.8 },
      metadata: { rating: 4.9, downloads: 734, tags: ['virtual', 'educação'] }
    }
  ];

  const categories = [
    { id: 'all', name: 'Todos', icon: '🌍' },
    { id: 'industrial', name: 'Industrial', icon: '🏭' },
    { id: 'construction', name: 'Construção', icon: '🏗️' },
    { id: 'office', name: 'Escritório', icon: '🏢' },
    { id: 'medical', name: 'Médico', icon: '🏥' },
    { id: 'outdoor', name: 'Externo', icon: '🌳' },
    { id: 'virtual', name: 'Virtual', icon: '🚀' }
  ];

  const filteredEnvironments = environments.filter(env => 
    selectedCategory === 'all' || env.category === selectedCategory
  );

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  const handleCreateScene = async () => {
    if (!selectedEnvironment) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/3d-environments/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environmentId: selectedEnvironment.id,
          avatars: [],
          props: []
        })
      });

      if (response.ok) {
        const scene = await response.json();
        setCurrentScene(scene);
        setViewMode('edit');
      }
    } catch (error) {
      logger.error('Erro ao criar cena', error instanceof Error ? error : new Error(String(error)), { component: 'EnvironmentStudio', environmentId: selectedEnvironment?.id });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenderScene = async () => {
    if (!currentScene) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/3d-environments/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: currentScene.id,
          options: {
            resolution: '1080p',
            fps: 30,
            quality: 'balanced',
            format: 'mp4'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        logger.info('Renderização iniciada', { component: 'EnvironmentStudio', sceneId: currentScene?.id, result });
      }
    } catch (error) {
      logger.error('Erro ao renderizar', error instanceof Error ? error : new Error(String(error)), { component: 'EnvironmentStudio', sceneId: currentScene?.id });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌍 3D Environment Studio
          </h1>
          <p className="text-gray-600 text-lg">
            Crie cenários imersivos e profissionais para seus vídeos de treinamento
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Environment Library */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Box className="h-5 w-5" />
                  <span>Biblioteca 3D</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Categorias</h4>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-100 text-blue-800'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Environment List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Ambientes ({filteredEnvironments.length})</h4>
                  {filteredEnvironments.map((env) => (
                    <div
                      key={env.id}
                      onClick={() => setSelectedEnvironment(env)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedEnvironment?.id === env.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm line-clamp-2">{env.name}</h3>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs">{env.metadata.rating}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{env.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline"
                          className={`text-xs ${getComplexityColor(env.performance.complexity)}`}
                        >
                          {getComplexityIcon(env.performance.complexity)} {env.performance.complexity}
                        </Badge>
                        
                        <div className="flex space-x-1">
                          {env.compatibility.mobile && <Smartphone className="h-3 w-3 text-gray-400" />}
                          {env.compatibility.desktop && <Monitor className="h-3 w-3 text-gray-400" />}
                          {env.compatibility.vr && <Headphones className="h-3 w-3 text-gray-400" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{env.metadata.downloads.toLocaleString()} downloads</span>
                        <span>{env.performance.loadTime}s load</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedEnvironment ? (
              <Tabs value={viewMode} onValueChange={(value) => value}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preview">👁️ Preview</TabsTrigger>
                  <TabsTrigger value="edit">✏️ Editar</TabsTrigger>
                  <TabsTrigger value="render">🎬 Renderizar</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="space-y-6">
                  {/* Environment Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>🎬 {selectedEnvironment.name}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{selectedEnvironment.category}</Badge>
                          {getComplexityIcon(selectedEnvironment.performance.complexity)}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 3D Preview Canvas */}
                        <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                          <canvas
                            ref={canvasRef}
                            className="w-full h-full"
                            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}
                          />
                          
                          {/* Preview Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="text-center text-white">
                              <Box className="h-16 w-16 mx-auto mb-4 opacity-70" />
                              <h3 className="text-xl font-semibold mb-2">Preview 3D Interativo</h3>
                              <p className="text-sm opacity-80">Use os controles para navegar no ambiente</p>
                            </div>
                          </div>

                          {/* Controls Overlay */}
                          <div className="absolute bottom-4 left-4 flex space-x-2">
                            <Button variant="secondary" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Orbit
                            </Button>
                            <Button variant="secondary" size="sm">
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                            <Button variant="secondary" size="sm">
                              <Maximize className="h-4 w-4 mr-1" />
                              Fullscreen
                            </Button>
                          </div>
                        </div>

                        {/* Environment Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <Layers className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                            <div className="text-lg font-bold">{(selectedEnvironment.performance.polygonCount / 1000).toFixed(0)}K</div>
                            <p className="text-xs text-gray-600">Polígonos</p>
                          </div>
                          
                          <div className="text-center p-4 border rounded-lg">
                            <Timer className="h-6 w-6 mx-auto mb-2 text-green-600" />
                            <div className="text-lg font-bold">{selectedEnvironment.performance.loadTime}s</div>
                            <p className="text-xs text-gray-600">Tempo de Carga</p>
                          </div>
                          
                          <div className="text-center p-4 border rounded-lg">
                            <Star className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                            <div className="text-lg font-bold">{selectedEnvironment.metadata.rating}</div>
                            <p className="text-xs text-gray-600">Avaliação</p>
                          </div>
                        </div>

                        {/* Compatibility */}
                        <div>
                          <h4 className="text-sm font-medium mb-3">Compatibilidade</h4>
                          <div className="flex space-x-4">
                            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                              selectedEnvironment.compatibility.mobile ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <Smartphone className="h-4 w-4" />
                              <span className="text-sm">Mobile</span>
                            </div>
                            
                            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                              selectedEnvironment.compatibility.desktop ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <Monitor className="h-4 w-4" />
                              <span className="text-sm">Desktop</span>
                            </div>
                            
                            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                              selectedEnvironment.compatibility.vr ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <Headphones className="h-4 w-4" />
                              <span className="text-sm">VR</span>
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedEnvironment.metadata.tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                          <Button onClick={handleCreateScene} disabled={isLoading} className="flex-1">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Criar Cena
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            Download 3D
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="edit" className="space-y-6">
                  {currentScene ? (
                    <>
                      {/* Scene Editor */}
                      <Card>
                        <CardHeader>
                          <CardTitle>✏️ Editor de Cena 3D</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* 3D Editor Canvas */}
                          <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            <canvas
                              ref={canvasRef}
                              className="w-full h-full"
                              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
                            />
                            
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-white">
                                <Settings className="h-16 w-16 mx-auto mb-4 opacity-70" />
                                <h3 className="text-xl font-semibold mb-2">Editor 3D Ativo</h3>
                                <p className="text-sm opacity-80">Arraste avatares e objetos para posicionar</p>
                              </div>
                            </div>

                            {/* Editor Tools */}
                            <div className="absolute top-4 left-4 flex space-x-2">
                              <Button variant="secondary" size="sm">
                                <Users className="h-4 w-4 mr-1" />
                                Avatares
                              </Button>
                              <Button variant="secondary" size="sm">
                                <Box className="h-4 w-4 mr-1" />
                                Objetos
                              </Button>
                              <Button variant="secondary" size="sm">
                                <Camera className="h-4 w-4 mr-1" />
                                Câmeras
                              </Button>
                            </div>

                            <div className="absolute bottom-4 right-4">
                              <Button variant="secondary" size="sm">
                                <Play className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                            </div>
                          </div>

                          {/* Lighting Controls */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h4 className="font-semibold flex items-center space-x-2">
                                <Lightbulb className="h-4 w-4" />
                                <span>Iluminação</span>
                              </h4>
                              
                              <div>
                                <label className="block text-sm font-medium mb-2">Luz Ambiente</label>
                                <Slider
                                  value={lightingSettings.ambient}
                                  onValueChange={(value) => setLightingSettings({...lightingSettings, ambient: value})}
                                  min={0}
                                  max={1}
                                  step={0.1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>Escuro</span>
                                  <span>{lightingSettings.ambient[0].toFixed(1)}</span>
                                  <span>Claro</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-2">Luz Direcional</label>
                                <Slider
                                  value={lightingSettings.directional}
                                  onValueChange={(value) => setLightingSettings({...lightingSettings, directional: value})}
                                  min={0}
                                  max={1}
                                  step={0.1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>Suave</span>
                                  <span>{lightingSettings.directional[0].toFixed(1)}</span>
                                  <span>Intenso</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <input 
                                  type="checkbox" 
                                  id="shadows"
                                  checked={lightingSettings.shadows}
                                  onChange={(e) => setLightingSettings({...lightingSettings, shadows: e.target.checked})}
                                />
                                <label htmlFor="shadows" className="text-sm">Ativar sombras realistas</label>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-semibold flex items-center space-x-2">
                                <Camera className="h-4 w-4" />
                                <span>Câmera</span>
                              </h4>
                              
                              <div>
                                <label className="block text-sm font-medium mb-2">Campo de Visão (FOV)</label>
                                <Slider
                                  value={cameraSettings.fov}
                                  onValueChange={(value) => setCameraSettings({...cameraSettings, fov: value})}
                                  min={30}
                                  max={120}
                                  step={5}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>Zoom</span>
                                  <span>{cameraSettings.fov[0]}°</span>
                                  <span>Wide</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs font-medium mb-1">X</label>
                                  <input 
                                    type="number" 
                                    value={cameraSettings.position.x}
                                    onChange={(e) => setCameraSettings({
                                      ...cameraSettings, 
                                      position: {...cameraSettings.position, x: Number(e.target.value)}
                                    })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Y</label>
                                  <input 
                                    type="number" 
                                    value={cameraSettings.position.y}
                                    onChange={(e) => setCameraSettings({
                                      ...cameraSettings, 
                                      position: {...cameraSettings.position, y: Number(e.target.value)}
                                    })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Z</label>
                                  <input 
                                    type="number" 
                                    value={cameraSettings.position.z}
                                    onChange={(e) => setCameraSettings({
                                      ...cameraSettings, 
                                      position: {...cameraSettings.position, z: Number(e.target.value)}
                                    })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Scene Elements */}
                      <Card>
                        <CardHeader>
                          <CardTitle>🎭 Elementos da Cena</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <h4 className="font-semibold mb-1">Adicionar Avatar</h4>
                              <p className="text-xs text-gray-600">Arraste avatares 3D para a cena</p>
                            </div>

                            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                              <Box className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <h4 className="font-semibold mb-1">Adicionar Objeto</h4>
                              <p className="text-xs text-gray-600">Equipamentos e props 3D</p>
                            </div>

                            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                              <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <h4 className="font-semibold mb-1">Efeitos Especiais</h4>
                              <p className="text-xs text-gray-600">Partículas e animações</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            Selecione um Ambiente
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Escolha um ambiente para começar a criar sua cena 3D
                          </p>
                          <Button onClick={handleCreateScene}>
                            Criar Nova Cena
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="render" className="space-y-6">
                  {currentScene ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>🎬 Renderização de Vídeo 3D</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Render Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Resolução</label>
                              <select className="w-full px-3 py-2 border rounded-md">
                                <option value="720p">HD (1280x720)</option>
                                <option value="1080p">Full HD (1920x1080)</option>
                                <option value="4K">4K (3840x2160)</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">Taxa de Quadros</label>
                              <select className="w-full px-3 py-2 border rounded-md">
                                <option value="24">24 FPS (Cinema)</option>
                                <option value="30">30 FPS (Padrão)</option>
                                <option value="60">60 FPS (Fluido)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Qualidade</label>
                              <select className="w-full px-3 py-2 border rounded-md">
                                <option value="fast">⚡ Rápido (Preview)</option>
                                <option value="balanced">⚖️ Balanceado</option>
                                <option value="high">💎 Alta Qualidade</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">Formato</label>
                              <select className="w-full px-3 py-2 border rounded-md">
                                <option value="mp4">MP4 (Compatível)</option>
                                <option value="webm">WebM (Web)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Render Preview */}
                        <div className="bg-gray-50 border rounded-lg p-6 text-center">
                          <div className="text-4xl mb-3">🎬</div>
                          <h3 className="text-lg font-semibold mb-2">Preview da Renderização</h3>
                          <p className="text-gray-600 mb-4">
                            Tempo estimado: ~45 segundos para Full HD
                          </p>
                          
                          <Button 
                            onClick={handleRenderScene}
                            disabled={isLoading}
                            size="lg"
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Renderizando...
                              </>
                            ) : (
                              <>
                                <Play className="h-5 w-5 mr-2" />
                                Iniciar Renderização
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Render Queue */}
                        <div>
                          <h4 className="text-sm font-medium mb-3">📋 Fila de Renderização</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="animate-pulse h-2 w-2 bg-blue-600 rounded-full"></div>
                                <span className="text-sm font-medium">Cena atual</span>
                              </div>
                              <Badge variant="default">Em andamento</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <Camera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            Nenhuma Cena Criada
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Crie uma cena primeiro para poder renderizar
                          </p>
                          <Button onClick={handleCreateScene}>
                            Criar Cena Agora
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Box className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Selecione um Ambiente 3D
                    </h3>
                    <p className="text-gray-500">
                      Escolha um ambiente da biblioteca para começar
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
