

'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { 
  Smartphone, 
  Download, 
  X, 
  Zap, 
  Wifi, 
  Bell, 
  Maximize,
  CheckCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [supportsPWA, setSupportsPWA] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Check for PWA support
    if ('serviceWorker' in navigator) {
      setSupportsPWA(true)
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      toast.success('App instalado com sucesso!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Auto-show prompt after 30 seconds if not installed
    const timer = setTimeout(() => {
      if (!isInstalled && deferredPrompt && !localStorage.getItem('pwa-prompt-dismissed')) {
        setShowPrompt(true)
      }
    }, 30000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(timer)
    }
  }, [deferredPrompt, isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        toast.success('Instalação iniciada!')
      } else {
        toast('Instalação cancelada')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      logger.error('Erro na instalação', error instanceof Error ? error : new Error(String(error)), { component: 'PWAInstallPrompt' })
      toast.error('Erro na instalação do app')
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
    toast('Você pode instalar o app a qualquer momento nas configurações')
  }

  const pwaFeatures = [
    {
      icon: Zap,
      title: 'Performance Otimizada',
      description: 'Carregamento mais rápido e uso eficiente de recursos'
    },
    {
      icon: Wifi,
      title: 'Funciona Offline',
      description: 'Acesse projetos salvos mesmo sem internet'
    },
    {
      icon: Bell,
      title: 'Notificações Push',
      description: 'Receba atualizações sobre seus projetos'
    },
    {
      icon: Maximize,
      title: 'Tela Cheia',
      description: 'Experience imersiva sem distrações do navegador'
    }
  ]

  if (isInstalled) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                App Instalado ✨
              </p>
              <p className="text-xs text-green-700">
                Estúdio IA está rodando como aplicativo nativo!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!supportsPWA || !showPrompt) return null

  return (
    <>
      {/* Small prompt */}
      <Card className="fixed bottom-4 right-4 z-50 max-w-sm border-blue-200 bg-blue-50 shadow-lg">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Instalar App
                </p>
                <p className="text-xs text-blue-700">
                  Acesso rápido e funcionalidades offline
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-blue-600 hover:text-blue-800 -mt-1 -mr-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  Saiba Mais
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Instalar Estúdio IA
                  </DialogTitle>
                  <DialogDescription>
                    Transforme sua experiência com nosso aplicativo web progressivo
                  </DialogDescription>
                </DialogHeader>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                  {pwaFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <feature.icon className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-sm">{feature.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Installation Benefits */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Por que instalar?
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Acesso direto da tela inicial do seu dispositivo</li>
                    <li>• Carregamento instantâneo de projetos</li>
                    <li>• Notificações de renderização e colaboração</li>
                    <li>• Funcionalidades offline para revisões</li>
                    <li>• Interface otimizada para mobile e desktop</li>
                  </ul>
                </div>

                <div className="flex gap-2 justify-end mt-6">
                  <Button variant="outline" onClick={() => setShowPrompt(false)}>
                    Agora Não
                  </Button>
                  <Button onClick={handleInstallClick} className="bg-blue-600 hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" />
                    Instalar App
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              size="sm" 
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-3 h-3 mr-1" />
              Instalar
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
