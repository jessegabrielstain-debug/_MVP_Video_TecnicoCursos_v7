
'use client'

/**
 * 🎭 VIDNOZ TALKING HEAD STUDIO - Engenharia Reversa Completa
 * Interface idêntica ao modelo Vidnoz com todas as funcionalidades
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Play, 
  Pause,
  Download,
  Upload,
  User,
  Mic,
  Video,
  Settings,
  Palette,
  Shirt,
  Camera,
  Zap,
  CheckCircle,
  Clock,
  Star,
  Users,
  Eye,
  Volume2,
  Sparkles,
  Edit3,
  Save,
  RotateCcw,
  Maximize2,
  Share2,
  Copy,
  Trash2,
  RefreshCw,
  FileText,
  Headphones,
  Sliders,
  Image as ImageIcon,
  Globe,
  Crown,
  Wand2,
  Target,
  Activity,
  BarChart3,
  Timer,
  Layers
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { HyperRealisticAvatar, AvatarRenderJob, AvatarGenerationOptions } from '@/lib/vidnoz-avatar-engine'

interface VidnozTalkingHeadStudioProps {
  onVideoGenerated?: (videoUrl: string) => void
  initialText?: string
  mode?: 'basic' | 'advanced' | 'pro'
}

interface AvatarTemplate {
  id: string
  name: string
  category: string
  preview: string
  description: string
  isPro?: boolean
  tags: string[]
}

interface VoiceProfile {
  id: string
  name: string
  language: string
  gender: 'male' | 'female'
  accent: string
  sample: string
  isPro?: boolean
  quality: 'standard' | 'neural' | 'studio'
}

interface ProjectSettings {
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3'
  resolution: 'HD' | '4K' | '8K'
  fps: 24 | 30 | 60
  duration: number
  quality: 'draft' | 'standard' | 'high' | 'ultra'
}

interface SavedProject {
  id: string
  name: string
  text: string
  selectedAvatar: string | undefined
  selectedVoice: string | undefined
  settings: ProjectSettings
  voiceSettings: {
    speed: number
    pitch: number
    emphasis: number
  }
  visualSettings: {
    emotion: string
    gesture: string
    clothing: string
    background: string
    lighting: 'soft' | 'natural' | 'professional' | 'dramatic'
    cameraAngle: string
  }
  customization: {
    enableSubtitles: boolean
    subtitleStyle: string
    brandColors: string
    logoUrl: string
    backgroundMusic: string | null
    musicVolume: number
  }
  createdAt: string
  updatedAt: string
  isAutoSave: boolean
}

const FPS_OPTIONS = ['24', '30', '60'] as const
type FpsOptionValue = (typeof FPS_OPTIONS)[number]

const parseFpsValue = (value: string): ProjectSettings['fps'] | null => {
  if (!FPS_OPTIONS.includes(value as FpsOptionValue)) {
    return null
  }

  return Number(value) as ProjectSettings['fps']
}

export default function VidnozTalkingHeadStudio({ 
  onVideoGenerated,
  initialText = '',
  mode = 'advanced'
}: VidnozTalkingHeadStudioProps) {
  // Estados principais
  const [avatars, setAvatars] = useState<HyperRealisticAvatar[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState<HyperRealisticAvatar | null>(null)
  const [text, setText] = useState(initialText)
  const [isGenerating, setIsGenerating] = useState(false)
  const [renderJob, setRenderJob] = useState<AvatarRenderJob | null>(null)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)

  // Estados da interface Vidnoz
  const [activeStep, setActiveStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<AvatarTemplate | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile | null>(null)
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    aspectRatio: '16:9',
    resolution: '4K',
    fps: 30,
    duration: 0,
    quality: 'high'
  })

  // Estados avançados
  const [voiceSpeed, setVoiceSpeed] = useState([1.0])
  const [voicePitch, setVoicePitch] = useState([0])
  const [voiceEmphasis, setVoiceEmphasis] = useState([0])
  const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null)
  const [musicVolume, setMusicVolume] = useState([0.3])
  
  // Estados visuais
  const [selectedEmotion, setSelectedEmotion] = useState('professional')
  const [selectedGesture, setSelectedGesture] = useState('natural')
  const [selectedClothing, setSelectedClothing] = useState('')
  const [selectedBackground, setSelectedBackground] = useState('studio')
  const [lightingSetup, setLightingSetup] = useState<'soft' | 'natural' | 'professional' | 'dramatic'>('professional')
  const [cameraAngle, setCameraAngle] = useState('medium')
  
  // Estados de personalização
  const [enableSubtitles, setEnableSubtitles] = useState(false)
  const [subtitleStyle, setSubtitleStyle] = useState('modern')
  const [brandColors, setBrandColors] = useState('#3B82F6')
  const [logoUrl, setLogoUrl] = useState('')
  
  // Estados de preview e player
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [previewMode, setPreviewMode] = useState<'avatar' | 'script' | 'voice'>('avatar')

  // Estados de produtividade
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([])
  const [projectName, setProjectName] = useState('Novo Projeto')
  const [isAutoSave, setIsAutoSave] = useState(true)
  const [exportFormat, setExportFormat] = useState('mp4')
  const [exportQuality, setExportQuality] = useState('high')

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Templates de avatares (simulando dados do Vidnoz)
  const avatarTemplates: AvatarTemplate[] = [
    {
      id: 'sarah_executive',
      name: 'Sarah - Executiva',
      category: 'Business',
      preview: 'https://cdn.abacus.ai/images/dd359ad5-040c-486a-8059-9ff2df7c493b.png',
      description: 'Perfeita para apresentações corporativas',
      tags: ['business', 'professional', 'female']
    },
    {
      id: 'carlos_teacher',
      name: 'Carlos - Instrutor',
      category: 'Education',
      preview: 'https://cdn.abacus.ai/images/5697b4ee-01b2-4598-8496-1f027f342162.png',
      description: 'Ideal para treinamentos e cursos',
      tags: ['education', 'friendly', 'male']
    },
    {
      id: 'ana_doctor',
      name: 'Ana - Médica',
      category: 'Healthcare',
      preview: 'https://cdn.abacus.ai/images/2f185cf6-c280-4be7-ba3d-0832c8c2764a.png',
      description: 'Especializada em conteúdo médico',
      tags: ['healthcare', 'professional', 'female'],
      isPro: true
    },
    {
      id: 'ricardo_engineer',
      name: 'Ricardo - Engenheiro',
      category: 'Technical',
      preview: 'https://cdn.abacus.ai/images/02c49698-fb39-4b49-8a6e-8cdb21d50dfb.png',
      description: 'Ideal para conteúdo técnico',
      tags: ['technical', 'analytical', 'male'],
      isPro: true
    },
    {
      id: 'julia_hr',
      name: 'Julia - RH',
      category: 'Human Resources',
      preview: 'https://cdn.abacus.ai/images/7e8162db-27fc-4e25-ac18-310de660597e.png',
      description: 'Perfeita para treinamentos de RH',
      tags: ['hr', 'friendly', 'female']
    },
    {
      id: 'diego_safety',
      name: 'Diego - Segurança',
      category: 'Safety',
      preview: 'https://cdn.abacus.ai/images/41d2d566-1f55-4e02-8b22-f35a76df47fb.png',
      description: 'Especializado em segurança do trabalho',
      tags: ['safety', 'authoritative', 'male']
    }
  ]

  const voiceProfiles: VoiceProfile[] = [
    {
      id: 'pt-BR-Neural2-A',
      name: 'Ana Clara - Profissional',
      language: 'pt-BR',
      gender: 'female',
      accent: 'São Paulo',
      sample: '/voices/ana-clara-sample.mp3',
      quality: 'neural'
    },
    {
      id: 'pt-BR-Neural2-B',
      name: 'João Pedro - Instrutor',
      language: 'pt-BR',
      gender: 'male',
      accent: 'Rio de Janeiro',
      sample: '/voices/joao-pedro-sample.mp3',
      quality: 'neural'
    },
    {
      id: 'pt-BR-Neural2-C',
      name: 'Camila - Médica',
      language: 'pt-BR',
      gender: 'female',
      accent: 'Minas Gerais',
      sample: '/voices/camila-sample.mp3',
      quality: 'studio',
      isPro: true
    },
    {
      id: 'pt-BR-Wavenet-A',
      name: 'Ricardo - Técnico',
      language: 'pt-BR',
      gender: 'male',
      accent: 'São Paulo',
      sample: '/voices/ricardo-sample.mp3',
      quality: 'neural',
      isPro: true
    },
    {
      id: 'pt-BR-Wavenet-B',
      name: 'Mariana - Acolhedora',
      language: 'pt-BR',
      gender: 'female',
      accent: 'Brasília',
      sample: '/voices/mariana-sample.mp3',
      quality: 'neural'
    },
    {
      id: 'pt-BR-Standard-A',
      name: 'Carlos - Segurança',
      language: 'pt-BR',
      gender: 'male',
      accent: 'São Paulo',
      sample: '/voices/carlos-sample.mp3',
      quality: 'standard'
    }
  ]

  useEffect(() => {
    loadAvatars()
    loadSavedProjects()
    
    // Auto-save functionality
    if (isAutoSave && text && projectName) {
      const autoSaveTimer = setTimeout(() => {
        saveProject(true)
      }, 30000) // Auto-save every 30 seconds
      
      return () => clearTimeout(autoSaveTimer)
    }
  }, [text, projectName, isAutoSave])

  const loadAvatars = async () => {
    try {
      const response = await fetch('/api/avatars/hyperreal/gallery')
      const data = await response.json()
      setAvatars(data.avatars || [])
      
      if (data.avatars?.length > 0 && !selectedAvatar) {
        setSelectedAvatar(data.avatars[0])
        setSelectedClothing(data.avatars[0].clothing[0]?.id || '')
      }
    } catch (error) {
      console.error('Erro ao carregar avatares:', error)
      toast.error('Erro ao carregar galeria de avatares')
    }
  }

  const loadSavedProjects = () => {
    const saved = localStorage.getItem('vidnoz-projects')
    if (saved) {
      setSavedProjects(JSON.parse(saved))
    }
  }

  const saveProject = (isAutoSave = false) => {
    const project = {
      id: Date.now().toString(),
      name: projectName,
      text,
      selectedAvatar: selectedAvatar?.id,
      selectedVoice: selectedVoice?.id,
      settings: projectSettings,
      voiceSettings: {
        speed: voiceSpeed[0],
        pitch: voicePitch[0],
        emphasis: voiceEmphasis[0]
      },
      visualSettings: {
        emotion: selectedEmotion,
        gesture: selectedGesture,
        clothing: selectedClothing,
        background: selectedBackground,
        lighting: lightingSetup,
        cameraAngle
      },
      customization: {
        enableSubtitles,
        subtitleStyle,
        brandColors,
        logoUrl,
        backgroundMusic,
        musicVolume: musicVolume[0]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAutoSave
    }

    const projects = [...savedProjects.filter(p => p.name !== projectName), project]
    setSavedProjects(projects)
    localStorage.setItem('vidnoz-projects', JSON.stringify(projects))
    
    if (!isAutoSave) {
      toast.success('Projeto salvo com sucesso!')
    }
  }

  const loadProject = (project: SavedProject) => {
    setProjectName(project.name)
    setText(project.text)
    setSelectedVoice(voiceProfiles.find(v => v.id === project.selectedVoice) || null)
    setProjectSettings(project.settings)
    setVoiceSpeed([project.voiceSettings.speed])
    setVoicePitch([project.voiceSettings.pitch])
    setVoiceEmphasis([project.voiceSettings.emphasis])
    setSelectedEmotion(project.visualSettings.emotion)
    setSelectedGesture(project.visualSettings.gesture)
    setSelectedClothing(project.visualSettings.clothing)
    setSelectedBackground(project.visualSettings.background)
    setLightingSetup(project.visualSettings.lighting)
    setCameraAngle(project.visualSettings.cameraAngle)
    setEnableSubtitles(project.customization.enableSubtitles)
    setSubtitleStyle(project.customization.subtitleStyle)
    setBrandColors(project.customization.brandColors)
    setLogoUrl(project.customization.logoUrl)
    setBackgroundMusic(project.customization.backgroundMusic)
    setMusicVolume([project.customization.musicVolume])
    
    toast.success('Projeto carregado!')
  }

  const handleAvatarSelect = (avatar: HyperRealisticAvatar) => {
    setSelectedAvatar(avatar)
    setSelectedClothing(avatar.clothing[0]?.id || '')
    setSelectedEmotion(avatar.emotions[0]?.id || 'professional')
    setSelectedGesture(avatar.gestureSet[0] || 'natural')
  }

  const generateVideo = async () => {
    if (!selectedAvatar || !text.trim()) {
      toast.error('Selecione um avatar e digite o texto')
      return
    }

    try {
      setIsGenerating(true)
      setRenderJob(null)
      setGeneratedVideoUrl(null)

      const options: AvatarGenerationOptions = {
        avatarId: selectedAvatar.id,
        text: text.trim(),
        voiceSettings: {
          speed: voiceSpeed[0],
          pitch: voicePitch[0],
          emotion: selectedEmotion,
          emphasis: text.split(' ').filter(word => word.includes('*')).map(word => word.replace(/\*/g, ''))
        },
        visualSettings: {
          emotion: selectedEmotion,
          gesture: selectedGesture,
          clothing: selectedClothing,
          background: selectedBackground,
          lighting: lightingSetup
        },
        outputSettings: {
          resolution: projectSettings.resolution,
          fps: projectSettings.fps,
          format: 'mp4',
          duration: 0
        }
      }

      const response = await fetch('/api/avatars/hyperreal/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...options,
          projectSettings,
          customization: {
            enableSubtitles,
            subtitleStyle,
            brandColors,
            logoUrl,
            backgroundMusic,
            musicVolume: musicVolume[0]
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setRenderJob(data.job)
        monitorRenderProgress(data.job.id)
        toast.success('🎬 Geração iniciada!')
      } else {
        throw new Error(data.error || 'Erro na geração')
      }

    } catch (error: unknown) {
      console.error('Erro na geração:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`❌ ${errorMessage}`)
      setIsGenerating(false)
    }
  }

  const monitorRenderProgress = async (jobId: string) => {
    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/avatars/hyperreal/status/${jobId}`)
        const job = await response.json()
        
        setRenderJob(job)
        
        if (job.status === 'completed') {
          setGeneratedVideoUrl(job.outputUrl)
          setIsGenerating(false)
          toast.success('🎉 Avatar gerado com sucesso!')
          onVideoGenerated?.(job.outputUrl)
        } else if (job.status === 'error') {
          setIsGenerating(false)
          toast.error(`❌ ${job.error || 'Erro na renderização'}`)
        } else {
          setTimeout(checkProgress, 2000)
        }
      } catch (error) {
        console.error('Erro ao verificar progresso:', error)
        setIsGenerating(false)
      }
    }

    setTimeout(checkProgress, 1000)
  }

  const playVoiceSample = (voiceProfile: VoiceProfile) => {
    const audio = new Audio(voiceProfile.sample)
    audio.play().catch(console.error)
    toast.success(`Reproduzindo sample de ${voiceProfile.name}`)
  }

  const estimatedDuration = Math.ceil(text.split(/\s+/).length / 2.5)
  const estimatedCost = Math.ceil(estimatedDuration * 0.05) // $0.05 por segundo estimado
  const wordsCount = text.split(/\s+/).filter(w => w.length > 0).length
  const readingTime = Math.ceil(wordsCount / 150) // 150 palavras por minuto

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Principal Estilo Vidnoz */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vidnoz Talking Head Studio</h1>
                <p className="text-sm text-gray-500">Avatar 3D Hiper-realista</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={() => saveProject()}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Projetos
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Projetos Salvos</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedProjects.map((project) => (
                      <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-sm">{project.name}</CardTitle>
                          <p className="text-xs text-gray-500">
                            {new Date(project.updatedAt).toLocaleDateString()} • {project.text.split(' ').length} palavras
                          </p>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 line-clamp-2">{project.text}</p>
                          <div className="flex space-x-2 mt-3">
                            <Button size="sm" onClick={() => loadProject(project)}>
                              <Eye className="h-3 w-3 mr-1" />
                              Carregar
                            </Button>
                            <Button size="sm" variant="outline">
                              <Copy className="h-3 w-3 mr-1" />
                              Duplicar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
                <Crown className="h-3 w-3 mr-1" />
                PRO
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Progresso de Steps */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {[
              { id: 1, name: 'Avatar', icon: Users },
              { id: 2, name: 'Script', icon: FileText },
              { id: 3, name: 'Voz', icon: Mic },
              { id: 4, name: 'Visual', icon: Eye },
              { id: 5, name: 'Exportar', icon: Download }
            ].map((step) => {
              const Icon = step.icon
              return (
                <div 
                  key={step.id}
                  className={`flex items-center space-x-2 cursor-pointer transition-colors ${
                    activeStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                  }`}
                  onClick={() => setActiveStep(step.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    activeStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    {activeStep > step.id ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="font-medium">{step.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal - Configurações */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Seleção de Avatar */}
            {activeStep === 1 && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-6 w-6" />
                    <span>Escolha seu Avatar</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {avatarTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => {
                          const avatar = avatars.find(a => a.id.includes(template.id.split('_')[0]))
                          if (avatar) {
                            handleAvatarSelect(avatar)
                            setSelectedTemplate(template)
                            setActiveStep(2)
                          }
                        }}
                        className={`
                          relative group cursor-pointer rounded-xl overflow-hidden border-3 transition-all duration-300 hover:scale-105
                          ${selectedTemplate?.id === template.id 
                            ? 'border-blue-500 ring-4 ring-blue-200 shadow-xl' 
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                          }
                        `}
                      >
                        <div className="aspect-[4/5] relative overflow-hidden">
                          <Image
                            src={template.preview}
                            alt={template.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          
                          {/* Overlay com informações */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <p className="text-white text-sm font-medium mb-2">{template.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {template.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs bg-white/20 text-white">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Badge PRO */}
                          {template.isPro && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black">
                                <Crown className="h-3 w-3 mr-1" />
                                PRO
                              </Badge>
                            </div>
                          )}

                          {/* Play button for preview */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 hover:scale-110 transition-transform">
                              <Play className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-white">
                          <h3 className="font-bold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-500">{template.category}</p>
                          
                          {selectedTemplate?.id === template.id && (
                            <div className="mt-3">
                              <Badge variant="default" className="bg-blue-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Selecionado
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedTemplate && (
                    <div className="mt-6 flex justify-end">
                      <Button onClick={() => setActiveStep(2)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                        Continuar para Script
                        <FileText className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Script e Texto */}
            {activeStep === 2 && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-6 w-6" />
                    <span>Escreva seu Script</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="project-name" className="text-base font-medium">Nome do Projeto</Label>
                      <Input
                        id="project-name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Digite o nome do projeto"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label htmlFor="script" className="text-base font-medium">Script do Avatar</Label>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{wordsCount} palavras</span>
                          <span>~{readingTime} min leitura</span>
                          <span>~{estimatedDuration}s vídeo</span>
                        </div>
                      </div>
                      
                      <Textarea
                        ref={textAreaRef}
                        id="script"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Digite aqui o texto que seu avatar falará. Use *palavras* para dar ênfase especial na narração..."
                        rows={8}
                        className="resize-none text-base leading-relaxed"
                      />
                      
                      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>Limite: 5000 caracteres</span>
                          <span className={`${text.length > 4500 ? 'text-orange-600' : ''} ${text.length > 4900 ? 'text-red-600' : ''}`}>
                            {text.length}/5000
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setText('')}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Limpar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Importar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Templates de script */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Templates Sugeridos</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          {
                            title: 'Apresentação Corporativa',
                            content: 'Olá! Seja bem-vindo à nossa apresentação. Hoje vamos abordar tópicos importantes sobre...'
                          },
                          {
                            title: 'Treinamento de Segurança',
                            content: 'A segurança no trabalho é fundamental. Neste treinamento, você aprenderá sobre...'
                          },
                          {
                            title: 'Curso Online',
                            content: 'Bem-vindos ao nosso curso. Ao final desta aula, vocês serão capazes de...'
                          },
                          {
                            title: 'Onboarding RH',
                            content: 'É um prazer tê-lo em nossa equipe! Vamos começar apresentando nossa cultura e valores...'
                          }
                        ].map((template) => (
                          <div 
                            key={template.title}
                            onClick={() => setText(template.content)}
                            className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <h4 className="font-medium text-gray-900">{template.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setActiveStep(1)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                      <Button 
                        onClick={() => setActiveStep(3)}
                        disabled={!text.trim()}
                        className="bg-gradient-to-r from-green-600 to-teal-600"
                      >
                        Continuar para Voz
                        <Mic className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Configurações de Voz */}
            {activeStep === 3 && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Mic className="h-6 w-6" />
                    <span>Configuração de Voz</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Seleção de Voz */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">Escolha a Voz</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {voiceProfiles.map((voice) => (
                          <div
                            key={voice.id}
                            onClick={() => setSelectedVoice(voice)}
                            className={`
                              p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                              ${selectedVoice?.id === voice.id 
                                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                                : 'border-gray-200 hover:border-purple-300'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">{voice.name}</h4>
                                <p className="text-sm text-gray-600">{voice.language} • {voice.accent}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {voice.isPro && (
                                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs">
                                    PRO
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {voice.quality}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  playVoiceSample(voice)
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Sample
                              </Button>
                              
                              {selectedVoice?.id === voice.id && (
                                <Badge variant="default" className="bg-purple-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Selecionado
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedVoice && (
                      <>
                        {/* Controles de Voz */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Velocidade: {voiceSpeed[0]}x</Label>
                            <Slider
                              value={voiceSpeed}
                              onValueChange={setVoiceSpeed}
                              min={0.5}
                              max={2.0}
                              step={0.1}
                              className="mt-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Lenta</span>
                              <span>Rápida</span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block">Tom: {voicePitch[0] > 0 ? '+' : ''}{voicePitch[0]}</Label>
                            <Slider
                              value={voicePitch}
                              onValueChange={setVoicePitch}
                              min={-10}
                              max={10}
                              step={1}
                              className="mt-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Grave</span>
                              <span>Agudo</span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block">Ênfase: {voiceEmphasis[0]}</Label>
                            <Slider
                              value={voiceEmphasis}
                              onValueChange={setVoiceEmphasis}
                              min={0}
                              max={10}
                              step={1}
                              className="mt-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Suave</span>
                              <span>Forte</span>
                            </div>
                          </div>
                        </div>

                        {/* Emoção */}
                        <div>
                          <Label className="text-base font-medium mb-3 block">Emoção da Voz</Label>
                          <RadioGroup value={selectedEmotion} onValueChange={setSelectedEmotion} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { id: 'professional', name: 'Profissional', desc: 'Tom corporativo' },
                              { id: 'friendly', name: 'Amigável', desc: 'Tom acolhedor' },
                              { id: 'confident', name: 'Confiante', desc: 'Tom assertivo' },
                              { id: 'teaching', name: 'Educativo', desc: 'Tom instrutivo' },
                              { id: 'caring', name: 'Cuidadoso', desc: 'Tom empático' },
                              { id: 'technical', name: 'Técnico', desc: 'Tom especializado' },
                              { id: 'welcoming', name: 'Acolhedor', desc: 'Tom receptivo' },
                              { id: 'authoritative', name: 'Autoritativo', desc: 'Tom firme' }
                            ].map((emotion) => (
                              <div key={emotion.id} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                                <RadioGroupItem value={emotion.id} id={emotion.id} />
                                <Label htmlFor={emotion.id} className="cursor-pointer">
                                  <div className="font-medium">{emotion.name}</div>
                                  <div className="text-xs text-gray-500">{emotion.desc}</div>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>

                        {/* Música de Fundo */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-base font-medium">Música de Fundo (Opcional)</Label>
                            <Switch
                              checked={!!backgroundMusic}
                              onCheckedChange={(checked) => setBackgroundMusic(checked ? 'corporate' : null)}
                            />
                          </div>
                          
                          {backgroundMusic && (
                            <div className="space-y-4">
                              <Select value={backgroundMusic} onValueChange={setBackgroundMusic}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Escolha uma música" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="corporate">Corporativo Suave</SelectItem>
                                  <SelectItem value="upbeat">Animada</SelectItem>
                                  <SelectItem value="calm">Calma e Relaxante</SelectItem>
                                  <SelectItem value="tech">Tecnológica</SelectItem>
                                  <SelectItem value="educational">Educacional</SelectItem>
                                </SelectContent>
                              </Select>

                              <div>
                                <Label className="text-sm font-medium mb-2 block">Volume da Música: {Math.round(musicVolume[0] * 100)}%</Label>
                                <Slider
                                  value={musicVolume}
                                  onValueChange={setMusicVolume}
                                  min={0}
                                  max={1}
                                  step={0.1}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setActiveStep(2)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                      <Button 
                        onClick={() => setActiveStep(4)}
                        disabled={!selectedVoice}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        Continuar para Visual
                        <Eye className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Configurações Visuais */}
            {activeStep === 4 && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-6 w-6" />
                    <span>Configurações Visuais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Configurações Rápidas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Qualidade</Label>
                        <Select value={projectSettings.quality} onValueChange={(value) => setProjectSettings({...projectSettings, quality: value as ProjectSettings['quality']})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Rascunho</SelectItem>
                            <SelectItem value="standard">Padrão</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="ultra">Ultra HD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Proporção</Label>
                        <Select value={projectSettings.aspectRatio} onValueChange={(value) => setProjectSettings({...projectSettings, aspectRatio: value as ProjectSettings['aspectRatio']})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9">16:9 (Paisagem)</SelectItem>
                            <SelectItem value="9:16">9:16 (Retrato)</SelectItem>
                            <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
                            <SelectItem value="4:3">4:3 (Clássico)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Resolução</Label>
                        <Select value={projectSettings.resolution} onValueChange={(value) => setProjectSettings({...projectSettings, resolution: value as ProjectSettings['resolution']})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HD">HD (1080p)</SelectItem>
                            <SelectItem value="4K">4K Ultra HD</SelectItem>
                            <SelectItem value="8K">8K Ultra HD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">FPS</Label>
                        <Select
                          value={projectSettings.fps.toString()}
                          onValueChange={(value) => {
                            const parsedFps = parseFpsValue(value)
                            if (!parsedFps) {
                              return
                            }
                            setProjectSettings((prev) => ({ ...prev, fps: parsedFps }))
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FPS_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option} FPS
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Visual Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Gestos */}
                      <div>
                        <Label className="text-base font-medium mb-3 block">Gestos do Avatar</Label>
                        <div className="space-y-2">
                          {[
                            { id: 'natural', name: 'Natural', desc: 'Gestos sutis e naturais' },
                            { id: 'presenting', name: 'Apresentação', desc: 'Gestos de apresentação' },
                            { id: 'explaining', name: 'Explicativo', desc: 'Gestos didáticos' },
                            { id: 'welcoming', name: 'Acolhedor', desc: 'Gestos receptivos' },
                            { id: 'pointing', name: 'Indicativo', desc: 'Gestos de direcionamento' },
                            { id: 'teaching', name: 'Educativo', desc: 'Gestos de ensino' }
                          ].map((gesture) => (
                            <div 
                              key={gesture.id}
                              onClick={() => setSelectedGesture(gesture.id)}
                              className={`
                                p-3 rounded-lg border cursor-pointer transition-all
                                ${selectedGesture === gesture.id 
                                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                                  : 'border-gray-200 hover:border-orange-300'
                                }
                              `}
                            >
                              <div className="font-medium">{gesture.name}</div>
                              <div className="text-sm text-gray-600">{gesture.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cenário */}
                      <div>
                        <Label className="text-base font-medium mb-3 block">Cenário de Fundo</Label>
                        <div className="space-y-2">
                          {[
                            { id: 'studio', name: 'Estúdio Neutro', desc: 'Fundo limpo e profissional' },
                            { id: 'office', name: 'Escritório Moderno', desc: 'Ambiente corporativo' },
                            { id: 'conference', name: 'Sala de Conferência', desc: 'Ambiente de reunião' },
                            { id: 'classroom', name: 'Sala de Aula', desc: 'Ambiente educacional' },
                            { id: 'medical', name: 'Ambiente Médico', desc: 'Hospital ou clínica' },
                            { id: 'industrial', name: 'Industrial', desc: 'Ambiente fabril' }
                          ].map((bg) => (
                            <div 
                              key={bg.id}
                              onClick={() => setSelectedBackground(bg.id)}
                              className={`
                                p-3 rounded-lg border cursor-pointer transition-all
                                ${selectedBackground === bg.id 
                                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                                  : 'border-gray-200 hover:border-orange-300'
                                }
                              `}
                            >
                              <div className="font-medium">{bg.name}</div>
                              <div className="text-sm text-gray-600">{bg.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Configurações Avançadas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Iluminação</Label>
                        <Select value={lightingSetup} onValueChange={(value) => setLightingSetup(value as 'soft' | 'natural' | 'professional' | 'dramatic')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="soft">Suave</SelectItem>
                            <SelectItem value="natural">Natural</SelectItem>
                            <SelectItem value="professional">Profissional</SelectItem>
                            <SelectItem value="dramatic">Dramática</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Ângulo da Câmera</Label>
                        <Select value={cameraAngle} onValueChange={setCameraAngle}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="close">Plano Fechado</SelectItem>
                            <SelectItem value="medium">Plano Médio</SelectItem>
                            <SelectItem value="wide">Plano Aberto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Roupa</Label>
                        <Select value={selectedClothing} onValueChange={setSelectedClothing}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedAvatar?.clothing.map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.style} {item.color}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Personalização de Marca */}
                    <Card className="border-dashed border-2 border-gray-300">
                      <CardHeader>
                        <CardTitle className="text-base">Personalização de Marca</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="brand-colors" className="text-sm font-medium mb-2 block">Cor da Marca</Label>
                            <Input
                              id="brand-colors"
                              type="color"
                              value={brandColors}
                              onChange={(e) => setBrandColors(e.target.value)}
                              className="h-10"
                            />
                          </div>

                          <div>
                            <Label htmlFor="logo-url" className="text-sm font-medium mb-2 block">Logo (URL)</Label>
                            <Input
                              id="logo-url"
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                              placeholder="https://i.pinimg.com/736x/c3/51/84/c351844f3be5fa5df32375cd320e6894.jpg"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={enableSubtitles}
                              onCheckedChange={setEnableSubtitles}
                            />
                            <Label>Adicionar Legendas</Label>
                          </div>

                          {enableSubtitles && (
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Estilo da Legenda</Label>
                              <Select value={subtitleStyle} onValueChange={setSubtitleStyle}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="modern">Moderno</SelectItem>
                                  <SelectItem value="classic">Clássico</SelectItem>
                                  <SelectItem value="minimal">Minimalista</SelectItem>
                                  <SelectItem value="bold">Destacado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setActiveStep(3)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                      <Button 
                        onClick={() => setActiveStep(5)}
                        className="bg-gradient-to-r from-orange-600 to-red-600"
                      >
                        Continuar para Exportar
                        <Download className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Exportar e Gerar */}
            {activeStep === 5 && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-6 w-6" />
                    <span>Gerar e Exportar</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Resumo do Projeto */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                      <h3 className="font-bold text-lg text-gray-900 mb-4">Resumo do Projeto</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="bg-white p-3 rounded-lg shadow">
                            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                            <div className="font-bold text-gray-900">{selectedTemplate?.name}</div>
                            <div className="text-sm text-gray-600">Avatar</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-white p-3 rounded-lg shadow">
                            <Mic className="h-8 w-8 mx-auto text-green-600 mb-2" />
                            <div className="font-bold text-gray-900">{selectedVoice?.name.split(' - ')[0]}</div>
                            <div className="text-sm text-gray-600">Voz</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-white p-3 rounded-lg shadow">
                            <Timer className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                            <div className="font-bold text-gray-900">~{estimatedDuration}s</div>
                            <div className="text-sm text-gray-600">Duração</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-white p-3 rounded-lg shadow">
                            <Video className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                            <div className="font-bold text-gray-900">{projectSettings.resolution}</div>
                            <div className="text-sm text-gray-600">Qualidade</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Configurações de Export */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-base font-medium mb-3 block">Formato de Exportação</Label>
                        <div className="space-y-2">
                          {[
                            { id: 'mp4', name: 'MP4 (Recomendado)', desc: 'Compatível com todas as plataformas', size: '~80MB' },
                            { id: 'webm', name: 'WEBM', desc: 'Otimizado para web', size: '~60MB' },
                            { id: 'mov', name: 'MOV', desc: 'Qualidade máxima', size: '~120MB' }
                          ].map((format) => (
                            <div 
                              key={format.id}
                              onClick={() => setExportFormat(format.id)}
                              className={`
                                p-4 rounded-lg border cursor-pointer transition-all
                                ${exportFormat === format.id 
                                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                                  : 'border-gray-200 hover:border-indigo-300'
                                }
                              `}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{format.name}</div>
                                  <div className="text-sm text-gray-600">{format.desc}</div>
                                </div>
                                <Badge variant="outline">{format.size}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-medium mb-3 block">Qualidade de Exportação</Label>
                        <div className="space-y-2">
                          {[
                            { id: 'draft', name: 'Rascunho', desc: 'Rápido para testes', time: '~30s' },
                            { id: 'standard', name: 'Padrão', desc: 'Boa qualidade', time: '~2min' },
                            { id: 'high', name: 'Alta', desc: 'Qualidade profissional', time: '~5min' },
                            { id: 'ultra', name: 'Ultra', desc: 'Máxima qualidade', time: '~10min' }
                          ].map((quality) => (
                            <div 
                              key={quality.id}
                              onClick={() => setExportQuality(quality.id)}
                              className={`
                                p-4 rounded-lg border cursor-pointer transition-all
                                ${exportQuality === quality.id 
                                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                                  : 'border-gray-200 hover:border-indigo-300'
                                }
                              `}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{quality.name}</div>
                                  <div className="text-sm text-gray-600">{quality.desc}</div>
                                </div>
                                <Badge variant="outline">{quality.time}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Estimativas e Custos */}
                    <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50">
                      <CardContent className="p-6">
                        <h4 className="font-bold text-indigo-900 mb-4">Estimativas de Processamento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <Clock className="h-6 w-6 mx-auto text-indigo-600 mb-2" />
                            <div className="font-bold text-indigo-900">
                              {exportQuality === 'draft' ? '~30s' : 
                               exportQuality === 'standard' ? '~2min' :
                               exportQuality === 'high' ? '~5min' : '~10min'}
                            </div>
                            <div className="text-sm text-indigo-700">Tempo de Render</div>
                          </div>
                          <div className="text-center">
                            <Activity className="h-6 w-6 mx-auto text-green-600 mb-2" />
                            <div className="font-bold text-gray-900">{wordsCount} palavras</div>
                            <div className="text-sm text-gray-600">Script</div>
                          </div>
                          <div className="text-center">
                            <BarChart3 className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                            <div className="font-bold text-gray-900">98%</div>
                            <div className="text-sm text-gray-600">Lip Sync</div>
                          </div>
                          <div className="text-center">
                            <Target className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                            <div className="font-bold text-gray-900">
                              {projectSettings.resolution} • {projectSettings.fps}fps
                            </div>
                            <div className="text-sm text-gray-600">Output</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Progress de Geração */}
                    {renderJob && (
                      <Card className="border-2 border-blue-300 bg-blue-50">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-blue-900">Gerando Avatar...</h4>
                            <Badge variant="default" className="bg-blue-600">
                              {renderJob.progress}% Completo
                            </Badge>
                          </div>
                          
                          <Progress value={renderJob.progress} className="mb-4" />
                          
                          <div className="text-center">
                            <p className="text-blue-800 font-medium">
                              {renderJob.status === 'processing' && 'Processando áudio e sincronização labial...'}
                              {renderJob.status === 'rendering' && 'Renderizando avatar em alta qualidade...'}
                              {renderJob.status === 'completed' && '🎉 Avatar concluído com sucesso!'}
                            </p>
                            
                            {renderJob.status === 'processing' && (
                              <div className="flex items-center justify-center space-x-2 mt-3">
                                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                                <span className="text-sm text-blue-700">
                                  Tempo estimado restante: {Math.ceil((100 - renderJob.progress) / 20)}min
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Botões de Ação */}
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setActiveStep(4)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                      
                      <div className="flex space-x-3">
                        <Button variant="outline" onClick={() => saveProject()}>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Projeto
                        </Button>
                        
                        <Button 
                          onClick={generateVideo}
                          disabled={isGenerating || !selectedAvatar || !text.trim()}
                          size="lg"
                          className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <Zap className="h-5 w-5 mr-2" />
                              Gerar Avatar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Direita - Preview */}
          <div className="space-y-6">
            {/* Preview Player */}
            <Card className="sticky top-24 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="h-5 w-5" />
                    <span>Preview</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-900 relative">
                  {generatedVideoUrl ? (
                    <video
                      ref={videoRef}
                      controls
                      className="w-full h-full"
                      poster="/placeholder-video.jpg"
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    >
                      <source src={generatedVideoUrl} type="video/mp4" />
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                  ) : selectedTemplate ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={selectedTemplate.preview}
                        alt={selectedTemplate.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mb-4">
                            <Play className="h-8 w-8" />
                          </div>
                          <p className="font-medium">Clique em "Gerar Avatar" para visualizar</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Video className="h-12 w-12 mx-auto mb-2" />
                        <p>Selecione um avatar para preview</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Player Controls */}
                <div className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={!generatedVideoUrl}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <div className="text-sm text-gray-600">
                        {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
                      </div>
                    </div>
                    
                    {generatedVideoUrl && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const a = document.createElement('a')
                            a.href = generatedVideoUrl
                            a.download = `${projectName}.mp4`
                            a.click()
                            toast.success('Download iniciado!')
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Estatísticas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Palavras:</span>
                    <span className="font-medium">{wordsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração estimada:</span>
                    <span className="font-medium">~{estimatedDuration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tempo de leitura:</span>
                    <span className="font-medium">{readingTime}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Qualidade:</span>
                    <span className="font-medium">{projectSettings.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lip Sync:</span>
                    <span className="font-medium text-green-600">
                      {selectedAvatar?.lipSyncAccuracy || 98}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips e Recomendações */}
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yellow-800">
                  <Wand2 className="h-5 w-5" />
                  <span>Dicas Pro</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-yellow-800">
                <ul className="space-y-2">
                  <li>• Use *palavras* para enfatizar na narração</li>
                  <li>• Mantenha frases entre 10-20 palavras</li>
                  <li>• Pause com vírgulas e pontos</li>
                  <li>• Teste diferentes emoções de voz</li>
                  <li>• Salve projetos regularmente</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
