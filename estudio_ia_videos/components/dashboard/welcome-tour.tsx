'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PlayCircle, FileText, User, HelpCircle, CheckCircle } from 'lucide-react'

export function WelcomeTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour')
    if (!hasSeenTour) {
      // Small delay to allow UI to load
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenTour', 'true')
  }

  const steps = [
    {
      title: 'Bem-vindo ao Estúdio IA!',
      description: 'Vamos fazer um tour rápido para você começar a criar vídeos incríveis.',
      icon: <PlayCircle className="w-12 h-12 text-primary mb-4" />,
      content: (
        <div className="text-center text-sm text-muted-foreground">
          Nossa plataforma usa Inteligência Artificial para transformar suas ideias em vídeos de treinamento, segurança e comunicação interna.
        </div>
      )
    },
    {
      title: '1. Crie seu Projeto',
      description: 'Comece clicando no botão "Novo Projeto" ou usando os atalhos na tela inicial.',
      icon: <FileText className="w-12 h-12 text-blue-500 mb-4" />,
      content: (
        <ul className="text-sm text-left space-y-2 bg-muted p-4 rounded-lg">
          <li className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full" /> <strong>PPTX:</strong> Importe slides e gere vídeo automaticamente.</li>
          <li className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full" /> <strong>Avatar:</strong> Texto para vídeo com apresentadores virtuais.</li>
        </ul>
      )
    },
    {
      title: '2. Precisa de Ajuda?',
      description: 'Acesse nossa Central de Ajuda a qualquer momento na barra lateral.',
      icon: <HelpCircle className="w-12 h-12 text-green-500 mb-4" />,
      content: (
        <div className="text-center text-sm text-muted-foreground">
          Lá você encontra tutoriais passo a passo, dicas de uso e pode falar com nosso suporte. Procure pelo ícone <strong>?</strong>.
        </div>
      )
    },
    {
      title: 'Tudo Pronto!',
      description: 'Você já pode criar seu primeiro vídeo.',
      icon: <CheckCircle className="w-12 h-12 text-green-600 mb-4" />,
      content: (
        <div className="text-center">
          <Button size="lg" onClick={handleClose} className="w-full">
            Começar Agora
          </Button>
        </div>
      )
    }
  ]

  const currentStep = steps[step]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex justify-center">{currentStep.icon}</div>
          <DialogTitle className="text-center text-xl">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-center">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentStep.content}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {step < steps.length - 1 && (
            <Button onClick={handleNext} className="w-full">
              Próximo
            </Button>
          )}
          
          <div className="flex items-center justify-between mt-4 w-full">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-2 bg-muted'}`}
                />
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs text-muted-foreground">
              Pular Tour
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
