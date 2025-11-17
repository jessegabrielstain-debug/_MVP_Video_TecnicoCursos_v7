'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Wand2, 
  Play, 
  Video, 
  Palette, 
  Mic, 
  Brain,
  Sparkles,
  Zap,
  Eye,
  Camera,
  Download,
  Settings,
  ArrowRight,
  CheckCircle,
  Star,
  Layers,
  Volume2
} from 'lucide-react'
import AvatarSystemReal from './components/AvatarSystemReal'

export default function AvatarSystemRealPage() {
  const [showSystem, setShowSystem] = React.useState(false)

  const features = [
    {
      icon: <User className="w-8 h-8" />,
      title: "Geração de Avatares 3D",
      description: "Crie avatares 3D realistas com IA avançada",
      color: "bg-blue-500"
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Customização Completa",
      description: "Personalize aparência, roupas e acessórios",
      color: "bg-purple-500"
    },
    {
      icon: <Play className="w-8 h-8" />,
      title: "Animação Facial",
      description: "Sistema de animação facial baseado em IA",
      color: "bg-green-500"
    },
    {
      icon: <Volume2 className="w-8 h-8" />,
      title: "Sincronização Labial",
      description: "Lip-sync automático com áudio",
      color: "bg-orange-500"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Presets de Personalidade",
      description: "Biblioteca de personalidades pré-definidas",
      color: "bg-pink-500"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Renderização Real",
      description: "Renderização em tempo real com qualidade profissional",
      color: "bg-red-500"
    }
  ]

  const stats = [
    { label: "Avatares Criados", value: "10,000+", icon: <User className="w-5 h-5" /> },
    { label: "Expressões Disponíveis", value: "500+", icon: <Play className="w-5 h-5" /> },
    { label: "Presets de Personalidade", value: "100+", icon: <Brain className="w-5 h-5" /> },
    { label: "Qualidade de Renderização", value: "4K", icon: <Video className="w-5 h-5" /> }
  ]

  if (showSystem) {
    return <AvatarSystemReal />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Avatar System Real
            </h1>
          </div>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Sistema completo de criação, animação e renderização de avatares 3D com tecnologia de IA avançada. 
            Crie avatares realistas, anime-os com expressões naturais e exporte vídeos profissionais.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <Badge variant="secondary" className="px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              IA Avançada
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Eye className="w-4 h-4 mr-2" />
              Tempo Real
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              Qualidade 4K
            </Badge>
          </div>

          <Button 
            onClick={() => setShowSystem(true)}
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Acessar Avatar System
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-3 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className={`w-16 h-16 ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Capabilities Section */}
        <Card className="mb-12 border-0 shadow-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Capacidades do Sistema
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-4xl mx-auto">
              Uma plataforma completa que combina as mais avançadas tecnologias de IA para criação de avatares
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Geração Inteligente</h4>
                    <p className="text-gray-600">
                      Algoritmos de IA criam avatares únicos baseados em suas especificações
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Animação Natural</h4>
                    <p className="text-gray-600">
                      Expressões faciais e gestos corporais realistas com sincronização labial
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Customização Total</h4>
                    <p className="text-gray-600">
                      Controle completo sobre aparência, roupas, acessórios e personalidade
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Renderização Profissional</h4>
                    <p className="text-gray-600">
                      Qualidade 4K com renderização em tempo real e exportação para vídeo
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Biblioteca Extensa</h4>
                    <p className="text-gray-600">
                      Centenas de expressões, gestos e presets de personalidade disponíveis
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Integração Completa</h4>
                    <p className="text-gray-600">
                      Funciona perfeitamente com sistemas de voz e clonagem vocal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="text-center border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-12">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">
                Pronto para Criar Avatares Incríveis?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Experimente o sistema mais avançado de criação de avatares 3D com IA. 
                Crie, anime e exporte seus avatares em minutos.
              </p>
              <Button 
                onClick={() => setShowSystem(true)}
                size="lg" 
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>© 2024 Avatar System Real - Tecnologia de IA Avançada para Criação de Avatares</p>
        </div>
      </div>
    </div>
  )
}

