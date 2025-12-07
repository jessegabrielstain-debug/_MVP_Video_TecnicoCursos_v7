
'use client'
export const dynamic = 'force-dynamic';

import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  Wand2, 
  Music, 
  Sparkles,
  Crown,
  Zap,
  Star
} from 'lucide-react'

// Importar componentes
import ProfessionalVoiceStudioV3 from '@/components/tts/professional-voice-studio-v3'
// import VoiceCloningStudio from '@/components/tts/voice-cloning-studio'
// import AudioTimelineEditor from '@/components/tts/audio-timeline-editor'

function LoadingCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="min-h-[400px] flex items-center justify-center">
      <CardContent className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TTSAudioStudioPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <Mic className="h-12 w-12 text-purple-600" />
            <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            TTS & Audio Studio Premium
          </h1>
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1">
            <Crown className="h-3 w-3 mr-1" />
            SPRINT 3
          </Badge>
        </div>
        
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Sistema completo de produção de áudio com <strong>ElevenLabs Premium</strong>, 
          clonagem de voz por IA e timeline profissional para narração de vídeos educativos.
        </p>
        
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>29+ Vozes Premium</span>
          </div>
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-purple-500" />
            <span>Voice Cloning AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-green-500" />
            <span>Timeline Profissional</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-blue-500" />
            <span>Multi-idioma</span>
          </div>
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="voice-studio" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger 
            value="voice-studio" 
            className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <Mic className="h-4 w-4" />
            Voice Studio
            <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 text-xs">
              Novo
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="voice-cloning" 
            className="flex items-center gap-2 data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700"
          >
            <Wand2 className="h-4 w-4" />
            Voice Cloning
            <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 text-xs">
              AI
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="audio-timeline" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
          >
            <Music className="h-4 w-4" />
            Audio Timeline
            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 text-xs">
              Pro
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Voice Studio */}
        <TabsContent value="voice-studio" className="mt-0">
          <Suspense fallback={
            <LoadingCard 
              title="Carregando Professional Voice Studio..."
              description="Inicializando ElevenLabs e carregando vozes premium"
            />
          }>
            <ProfessionalVoiceStudioV3 />
            {/* <div className="p-4 border rounded bg-muted/10">
                <h3 className="text-lg font-semibold">Voice Studio (Temporarily Disabled for Debugging)</h3>
            </div> */}
          </Suspense>
        </TabsContent>

        {/* Voice Cloning */}
        <TabsContent value="voice-cloning" className="mt-0">
          <Suspense fallback={
            <LoadingCard 
              title="Carregando Voice Cloning Studio..."
              description="Preparando sistema de clonagem de voz por IA"
            />
          }>
            {/* <VoiceCloningStudio /> */}
            <div className="p-4 border rounded bg-muted/10">
                <h3 className="text-lg font-semibold">Voice Cloning (Temporarily Disabled for Debugging)</h3>
            </div>
          </Suspense>
        </TabsContent>

        {/* Audio Timeline */}
        <TabsContent value="audio-timeline" className="mt-0">
          <Suspense fallback={
            <LoadingCard 
              title="Carregando Audio Timeline Editor..."
              description="Inicializando timeline profissional multi-track"
            />
          }>
            {/* <AudioTimelineEditor /> */}
            <div className="p-4 border rounded bg-muted/10">
                <h3 className="text-lg font-semibold">Audio Timeline (Temporarily Disabled for Debugging)</h3>
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Footer com informações técnicas */}
      <div className="mt-12 text-center">
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-purple-700 dark:text-purple-300">
                  ElevenLabs Integration
                </div>
                <div className="text-muted-foreground">
                  API Premium ativa com 29+ vozes profissionais
                </div>
              </div>
              
              <div className="text-center">
                <div className="font-semibold text-pink-700 dark:text-pink-300">
                  Voice Cloning AI
                </div>
                <div className="text-muted-foreground">
                  Clonagem de voz com qualidade de estúdio
                </div>
              </div>
              
              <div className="text-center">
                <div className="font-semibold text-blue-700 dark:text-blue-300">
                  Timeline Profissional
                </div>
                <div className="text-muted-foreground">
                  Editor multi-track com sincronização precisa
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
