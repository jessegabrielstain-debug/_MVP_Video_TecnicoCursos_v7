
/**
 * 🖼️ Gerador de Imagens para Galeria de Avatares
 * Component para gerar as imagens dos avatares da galeria
 */

"use client"

import React, { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Image as ImageIcon } from 'lucide-react'

interface AvatarImageData {
  id: string
  name: string
  description: string
  style: string
  generated: boolean
  imageUrl?: string
}

const AVATAR_REQUESTS = [
  {
    id: 'woman-professional-brown',
    name: 'Sarah - Professional',
    description: 'Professional woman with brown hair, business attire, friendly smile, caucasian, corporate background',
    style: 'photorealistic portrait'
  },
  {
    id: 'man-young-casual',
    name: 'Alex - Young Professional',
    description: 'Young professional man, casual business attire, confident smile, modern office setting',
    style: 'photorealistic portrait'
  },
  {
    id: 'woman-african-business',
    name: 'Maya - Business Executive',
    description: 'African American business woman, executive suit, confident professional pose, corporate environment',
    style: 'photorealistic portrait'
  },
  {
    id: 'man-business-suit',
    name: 'Marcus - Corporate',
    description: 'Mixed-race corporate man in dark business suit, professional lighting, executive portrait',
    style: 'photorealistic portrait'
  },
  {
    id: 'cartoon-adventure',
    name: 'Adventure Girl',
    description: 'Animated cartoon girl character, adventure outfit, outdoor setting, vibrant colors, 3D animation style',
    style: 'cartoon animation'
  },
  {
    id: 'woman-nature-casual',
    name: 'Emma - Nature Guide',
    description: 'Caucasian woman in casual outdoor clothing, natural setting, warm friendly expression',
    style: 'photorealistic portrait'
  },
  {
    id: 'woman-beach-relaxed',
    name: 'Sophia - Beach Style',
    description: 'Latino woman in beach casual wear, relaxed ocean setting, sun-kissed skin, natural smile',
    style: 'photorealistic portrait'
  },
  {
    id: 'baby-cute',
    name: 'Baby Lucas',
    description: 'Adorable baby boy, cute expression, soft lighting, professional baby portrait, caucasian',
    style: 'photorealistic portrait'
  },
  {
    id: 'man-corporate-blonde',
    name: 'David - Executive',
    description: 'Blonde corporate executive man, expensive suit, confident business portrait, professional lighting',
    style: 'photorealistic portrait'
  },
  {
    id: 'woman-friendly-smile',
    name: 'Lisa - Friendly',
    description: 'Friendly caucasian woman with warm smile, casual professional attire, approachable demeanor',
    style: 'photorealistic portrait'
  },
  {
    id: 'cartoon-boy-adventure',
    name: 'Adventure Boy',
    description: 'Animated cartoon boy character, adventure explorer outfit, animated style, bright colors',
    style: 'cartoon animation'
  }
]

export default function AvatarGalleryImages() {
  const [avatars, setAvatars] = useState<AvatarImageData[]>(
    AVATAR_REQUESTS.map(req => ({ ...req, generated: false }))
  )
  const [isGenerating, setIsGenerating] = useState(false)

  const generateAllImages = async () => {
    setIsGenerating(true)

    for (let i = 0; i < AVATAR_REQUESTS.length; i++) {
      const avatar = AVATAR_REQUESTS[i]
      
      try {
        // Gerar imagem usando asset_retrieval_subtask
        const response = await fetch('/api/assets/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: `Generate a high-quality ${avatar.style} of ${avatar.description}`,
            context: `This is for an avatar gallery in a talking photo application. The image should be suitable for creating animated talking avatars. Aspect ratio should be portrait (3:4 or 4:5).`,
            filename: `${avatar.id}.jpg`
          })
        })

        if (response.ok) {
          const result = await response.json()
          
          setAvatars(prev => prev.map((av, idx) => 
            idx === i 
              ? { ...av, generated: true, imageUrl: result.imageUrl }
              : av
          ))
        }
      } catch (error) {
        logger.error('Erro ao gerar imagem', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarGalleryImages', avatarName: avatar.name })
      }

      // Delay entre gerações
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    setIsGenerating(false)
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      logger.error('Erro ao baixar imagem', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarGalleryImages' })
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          🖼️ Gerador de Imagens para Galeria de Avatares
        </h1>
        <p className="text-muted-foreground mb-6">
          Gere todas as imagens necessárias para a galeria de avatares do Vidnoz Talking Photo
        </p>
        
        <Button 
          onClick={generateAllImages}
          disabled={isGenerating}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-blue-500"
        >
          {isGenerating ? 'Gerando Imagens...' : '🎭 Gerar Todas as Imagens'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {avatars.map((avatar, index) => (
          <Card key={avatar.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{avatar.name}</span>
                <Badge variant={avatar.generated ? "default" : "secondary"}>
                  {avatar.generated ? "✅ Gerado" : "⏳ Pendente"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Preview da Imagem */}
                <div className="aspect-[4/5] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                  {avatar.generated && avatar.imageUrl ? (
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">
                        {isGenerating && index <= avatars.findIndex(a => !a.generated) 
                          ? 'Gerando...' 
                          : 'Aguardando geração'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {avatar.description}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {avatar.style}
                  </Badge>
                </div>

                {/* Botão de Download */}
                {avatar.generated && avatar.imageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => downloadImage(avatar.imageUrl!, `${avatar.id}.jpg`)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
