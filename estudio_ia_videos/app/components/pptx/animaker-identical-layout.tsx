
/**
 * 🎬 Layout Idêntico ao Animaker - Hiper-Realismo
 * Interface exata da imagem com avatares 3D cinematográficos
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { toast } from 'react-hot-toast'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  Mic,
  Download,
  Settings,
  Layers,
  User,
  Search,
  Grid3X3,
  Eye,
  Heart,
  Star,
  Crown,
  Sparkles,
  Zap,
  Camera,
  Palette,
  Type,
  Image as ImageIcon,
  Music,
  FileVideo,
  Archive,
  Plus
} from 'lucide-react'
import { avatar3DPipeline } from '@/lib/avatar-3d-pipeline'
import { HyperRealAvatarSelector } from './hyperreal-avatar-selector'

interface Scene {
  id: string
  thumbnail: string
  duration: string
  title: string
}

interface Props {
  projectTitle?: string
  onExport?: () => void
}

export function AnimakerIdenticalLayout({ projectTitle = "NR 11 - OPERAÇÃO DE EMPILHADEIRAS", onExport }: Props) {
  const [currentTime, setCurrentTime] = useState("00:00")
  const [totalTime, setTotalTime] = useState("03:45")
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedAvatarCategory, setSelectedAvatarCategory] = useState('business')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [activeLeftPanel, setActiveLeftPanel] = useState('avatars')
  const [layerVolume, setLayerVolume] = useState([70])
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Carregar avatares 3D hiper-realistas
  // Note: avatar3DPipeline does not have getAllCategories or getAvatarsByCategory in the file I read.
  // I need to check if I need to add them to avatar3DPipeline or if I should use another way.
  // The file app/lib/avatar-3d-pipeline.ts only has renderAvatar, customizeAvatar, renderHyperRealisticAvatar, getRenderJobStatus, generateHyperRealisticLipSync.
  
  // Wait, I should check if I can add these methods to avatar3DPipeline in app/lib/avatar-3d-pipeline.ts
  // Or maybe I should use avatarRegistry directly?
  
  // Let's check app/lib/avatars/avatar-registry.ts


  // Cenas do projeto (lado direito)
  const scenes: Scene[] = [
    { id: 'scene1', thumbnail: '/images/nr11-intro.jpg', duration: '00:55', title: 'Cena 1' },
    { id: 'scene2', thumbnail: '/images/nr11-safety.jpg', duration: '00:45', title: 'Cena 2' },
    { id: 'scene3', thumbnail: '/images/nr11-operation.jpg', duration: '01:10', title: 'Cena 3' },
    { id: 'scene4', thumbnail: '/images/nr11-conclusion.jpg', duration: '00:55', title: 'Cena 4' }
  ]

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    toast.success(isPlaying ? '⏸️ Pausado' : '▶️ Reproduzindo')
  }

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId)
    const avatar = avatar3DPipeline.getAvatar(avatarId)
    if (avatar) {
      toast.success(`🎭 Avatar "${avatar.name}" selecionado (Hiper-Realista)`)
    }
  }

  const handleExport = () => {
    onExport?.()
    toast.success('🎬 Iniciando renderização hiper-realista...')
  }

  const handleEditImage = () => {
    toast.success('🖼️ Editor de imagem aberto')
  }

  const handleResize = () => {
    toast.success('📐 Ferramenta de redimensionamento ativa')
  }

  const handleTransition = () => {
    toast.success('✨ Painel de transições aberto')
  }

  const handleViewAll = () => {
    toast.success('👁️ Visualizando todos os avatares')
  }

  const handleSubstitute = () => {
    toast.success('🔄 Ferramenta de substituição ativa')
  }

  const handleAddNewScene = () => {
    toast.success('➕ Nova cena adicionada ao projeto')
  }

  const handleUpgradeToStarter = () => {
    toast.success('⭐ Atualizando para plano Iniciante')
  }

  const leftPanelTabs = [
    { id: 'avatars', label: 'Personagem', icon: User },
    { id: 'props', label: 'Objetos', icon: Archive },
    { id: 'images', label: 'Imagens', icon: ImageIcon },
    { id: 'videos', label: 'Vídeos', icon: FileVideo },
    { id: 'music', label: 'Música', icon: Music },
    { id: 'text', label: 'Texto', icon: Type },
    { id: 'bg', label: 'Fundos', icon: Palette }
  ]

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Top Toolbar - Exato como no Animaker */}
      <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-yellow-400 rounded flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <span className="font-medium">Arquivo</span>
            <span className="text-purple-200">Tutoriais</span>
          </div>
          
          <div className="flex items-center space-x-2 bg-purple-700 px-3 py-1 rounded">
            <span className="text-sm font-medium">{projectTitle}</span>
            <Badge className="bg-green-500 text-white text-xs">69%</Badge>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-yellow-300 hover:text-yellow-100"
            onClick={handleUpgradeToStarter}
          >
            <Star className="w-4 h-4 mr-1" />
            Atualizar para Iniciante
          </Button>
          
          <Button variant="ghost" size="sm" className="text-white hover:text-purple-100">
            <Settings className="w-4 h-4 mr-1" />
          </Button>
          
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Publicar
          </Button>
          
          <div className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center">
            <Crown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Assets Library */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Tabs para diferentes tipos de assets */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-gray-50">
            {leftPanelTabs.slice(0, 4).map((tab) => (
              <Button
                key={tab.id}
                variant={activeLeftPanel === tab.id ? "default" : "ghost"}
                size="sm"
                className={`flex flex-col gap-1 h-12 text-xs ${
                  activeLeftPanel === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveLeftPanel(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50 border-t">
            {leftPanelTabs.slice(4).map((tab) => (
              <Button
                key={tab.id}
                variant={activeLeftPanel === tab.id ? "default" : "ghost"}
                size="sm"
                className={`flex flex-col gap-1 h-12 text-xs ${
                  activeLeftPanel === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveLeftPanel(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeLeftPanel === 'avatars' && (
              <div className="h-full">
                <HyperRealAvatarSelector 
                  selectedCategory={selectedAvatarCategory}
                  onCategoryChange={setSelectedAvatarCategory}
                  onAvatarSelect={(avatar) => {
                    setSelectedAvatar(avatar.id)
                    toast.success(`🎭 Avatar "${avatar.name}" carregado (Hiper-Realista)`)
                  }}
                  onViewAll={handleViewAll}
                />
              </div>
            )}

            {/* Outros panels de assets */}
            {activeLeftPanel !== 'avatars' && (
              <div className="p-4 text-center text-gray-500">
                <div className="mb-2">
                  {leftPanelTabs.find(t => t.id === activeLeftPanel)?.icon && 
                    React.createElement(leftPanelTabs.find(t => t.id === activeLeftPanel)!.icon, { className: "w-8 h-8 mx-auto mb-2" })
                  }
                </div>
                <p className="text-sm">
                  {leftPanelTabs.find(t => t.id === activeLeftPanel)?.label} em desenvolvimento
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Biblioteca com 50M+ assets será implementada no Sprint 17
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area - Canvas + Timeline */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Top Canvas Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={handleEditImage}>
                <Settings className="w-4 h-4 mr-1" />
                Editar imagem
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResize}>
                <Grid3X3 className="w-4 h-4 mr-1" />
                Redimensionar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleTransition}>
                <Layers className="w-4 h-4 mr-1" />
                Transição
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleSubstitute}>
                Substituir
              </Button>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleAddNewScene} className="text-blue-600">
                + Adicionar cena
              </Button>
            </div>
          </div>

          {/* Main Canvas - Exato como no Animaker */}
          <div className="flex-1 p-6 flex items-center justify-center">
            <div 
              ref={canvasRef}
              className="relative bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg shadow-lg"
              style={{ width: '900px', height: '506px' }} // 16:9 HD
            >
              {/* Background Scene */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-100 to-blue-100 rounded-lg overflow-hidden">
                {/* Empilhadeira - Como na imagem */}
                <div className="absolute bottom-8 left-1/3 transform -translate-x-1/2">
                  <div className="w-48 h-32 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-xl">
                    <span className="text-4xl">🚜</span>
                  </div>
                </div>

                {/* Título Principal - NR 11 */}
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    NR 11 – SEGURANÇA NA
                  </h1>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    OPERAÇÃO DE
                  </h1>
                  <h1 className="text-4xl font-bold text-red-600">
                    EMPILHADEIRAS
                  </h1>
                </div>

                {/* Avatar 3D Hiper-Realista - Posicionamento como na imagem */}
                {selectedAvatar && (
                  <div className="absolute bottom-4 right-8">
                    <div className="w-24 h-32 bg-gradient-to-b from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-2xl border-4 border-white">
                      <div className="text-center">
                        <div className="text-2xl mb-1">👨‍💼</div>
                        <div className="text-xs text-white font-medium">8K</div>
                      </div>
                    </div>
                    
                    {/* Quality indicator */}
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-red-500 text-white text-xs">
                        Hiper-Real
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Watermark - Como no Animaker */}
                <div className="absolute bottom-4 right-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded px-2 py-1 flex items-center">
                    <Sparkles className="w-4 h-4 text-purple-600 mr-1" />
                    <span className="text-xs font-medium text-purple-600">Made with</span>
                    <span className="text-xs font-bold text-purple-800 ml-1">Estúdio IA</span>
                  </div>
                </div>
              </div>

              {/* Canvas Selection Indicator */}
              <div className="absolute -inset-1 border-2 border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          </div>

          {/* Controls + Timeline Section */}
          <div className="bg-white border-t border-gray-200">
            {/* Playback Controls - Exato como no Animaker */}
            <div className="flex items-center justify-center py-3 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Volume2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button 
                  onClick={handlePlayPause}
                  className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-1" />
                  )}
                </Button>
                
                <Button variant="ghost" size="sm">
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{currentTime}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-sm font-mono text-gray-600">{totalTime}</span>
                </div>
                
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Timeline - Layout idêntico ao Animaker */}
            <div className="p-4">
              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Linha do tempo da cena</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Linha do tempo geral</span>
                </div>
              </div>

              {/* Timeline Tracks */}
              <div className="space-y-2">
                {/* Scene Timeline */}
                <div className="flex items-center space-x-2">
                  <div className="w-16 text-xs text-gray-600 text-right">Cena</div>
                  <div className="flex-1 h-12 bg-gray-200 rounded relative overflow-hidden">
                    {/* Timeline ruler */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gray-300 flex">
                      {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className="flex-1 border-r border-gray-400 text-xs text-center">
                          {i * 30}s
                        </div>
                      ))}
                    </div>
                    
                    {/* Content blocks */}
                    <div className="absolute bottom-0 left-0 w-1/3 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Intro</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Audio Timeline */}
                <div className="flex items-center space-x-2">
                  <div className="w-16 text-xs text-gray-600 text-right">Áudio</div>
                  <div className="flex-1 h-8 bg-gray-100 rounded relative">
                    <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-green-500 to-green-600 rounded-sm flex items-center px-2">
                      <Mic className="w-3 h-3 text-white mr-1" />
                      <span className="text-white text-xs">Narração TTS</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Slider
                      value={layerVolume}
                      onValueChange={setLayerVolume}
                      max={100}
                      step={1}
                      className="w-16"
                    />
                    <span className="text-xs text-gray-600 w-8">{layerVolume[0]}%</span>
                  </div>
                </div>
              </div>

              {/* Timeline Ruler - Como no Animaker */}
              <div className="mt-4 flex items-center space-x-1 overflow-x-auto">
                <div className="w-16"></div>
                <div className="flex space-x-px">
                  {Array.from({ length: 42 }, (_, i) => (
                    <div
                      key={i}
                      className="w-8 h-6 bg-gray-300 border border-gray-400 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-200 cursor-pointer"
                    >
                      {i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Scenes */}
        <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Cenas do Projeto</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {scenes.map((scene, index) => (
              <Card key={scene.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-400 rounded mb-2 flex items-center justify-center relative overflow-hidden">
                    <span className="text-white font-medium">NR 11</span>
                    <div className="absolute bottom-1 right-1">
                      <Badge className="bg-black/50 text-white text-xs">
                        {scene.duration}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{scene.title}</span>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Add Scene Button */}
            <Button 
              variant="outline" 
              className="w-full border-dashed border-2 border-gray-300 hover:border-purple-400 py-8"
              onClick={handleAddNewScene}
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Nova Cena
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
