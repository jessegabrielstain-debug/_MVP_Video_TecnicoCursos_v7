'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  Wand2, 
  Play, 
  Volume2, 
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
  Users,
  Clock,
  Headphones,
  Music,
  Radio
} from 'lucide-react'
import VoiceCloningStudioAdvanced from './components/VoiceCloningStudioAdvanced'

export default function VoiceCloningAdvancedPage() {
  const [showStudio, setShowStudio] = React.useState(false)

  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Clonagem de Voz com IA",
      description: "Clone qualquer voz com apenas 30 segundos de áudio",
      color: "bg-blue-500"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Treinamento Personalizado",
      description: "Modelos de IA treinados especificamente para sua voz",
      color: "bg-purple-500"
    },
    {
      icon: <Volume2 className="w-8 h-8" />,
      title: "Síntese em Tempo Real",
      description: "Gere fala natural instantaneamente com qualidade profissional",
      color: "bg-green-500"
    },
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Controle de Emoção",
      description: "Ajuste tom, velocidade e emoção da voz clonada",
      color: "bg-orange-500"
    },
    {
      icon: <Music className="w-8 h-8" />,
      title: "Biblioteca de Vozes",
      description: "Acesso a centenas de vozes profissionais pré-treinadas",
      color: "bg-pink-500"
    },
    {
      icon: <Radio className="w-8 h-8" />,
      title: "Qualidade Broadcast",
      description: "Áudio em qualidade de estúdio para uso profissional",
      color: "bg-red-500"
    }
  ]

  const stats = [
    { label: "Vozes Clonadas", value: "50,000+", icon: <Mic className="w-5 h-5" /> },
    { label: "Idiomas Suportados", value: "25+", icon: <Users className="w-5 h-5" /> },
    { label: "Tempo de Clonagem", value: "30s", icon: <Clock className="w-5 h-5" /> },
    { label: "Qualidade de Áudio", value: "48kHz", icon: <Headphones className="w-5 h-5" /> }
  ]

  if (showStudio) {
    return <VoiceCloningStudioAdvanced />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Voice Cloning Advanced
            </h1>
          </div>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Sistema avançado de clonagem de voz com IA de última geração. Clone qualquer voz com precisão 
            profissional, controle total sobre emoções e síntese em tempo real.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <Badge variant="secondary" className="px-4 py-2">
              <Brain className="w-4 h-4 mr-2" />
              IA Neural
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Tempo Real
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              Qualidade Studio
            </Badge>
          </div>

          <Button 
            onClick={() => setShowStudio(true)}
            size="lg" 
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-4 text-lg"
          >
            <Mic className="w-5 h-5 mr-2" />
            Acessar Voice Studio
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-3 text-purple-600">
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

        {/* Technology Section */}
        <Card className="mb-12 border-0 shadow-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Tecnologia de Ponta
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-4xl mx-auto">
              Utilizamos as mais avançadas redes neurais para clonagem de voz com qualidade indistinguível do original
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Few-Shot Learning</h4>
                    <p className="text-gray-600">
                      Clone vozes com apenas 30 segundos de áudio usando aprendizado neural avançado
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Controle Emocional</h4>
                    <p className="text-gray-600">
                      Ajuste precisamente tom, velocidade, emoção e entonação da voz clonada
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Síntese Real-Time</h4>
                    <p className="text-gray-600">
                      Gere fala natural instantaneamente com latência menor que 200ms
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Qualidade Profissional</h4>
                    <p className="text-gray-600">
                      Áudio em qualidade de estúdio (48kHz/24-bit) pronto para broadcast
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Multi-idioma</h4>
                    <p className="text-gray-600">
                      Suporte nativo para 25+ idiomas com sotaques regionais precisos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Integração Completa</h4>
                    <p className="text-gray-600">
                      Funciona perfeitamente com avatares 3D e sistemas de vídeo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="text-center border-0 shadow-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="p-12">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">
                Revolucione sua Produção de Áudio
              </h2>
              <p className="text-xl mb-8 text-purple-100">
                Experimente o sistema mais avançado de clonagem de voz do mercado. 
                Crie vozes personalizadas em minutos, não em horas.
              </p>
              <Button 
                onClick={() => setShowStudio(true)}
                size="lg" 
                variant="secondary"
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                <Headphones className="w-5 h-5 mr-2" />
                Começar Clonagem
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>© 2024 Voice Cloning Advanced - Tecnologia Neural para Síntese de Voz</p>
        </div>
      </div>
    </div>
  )
}

