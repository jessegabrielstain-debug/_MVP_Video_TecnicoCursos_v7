'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PlayCircle, Sparkles, FileText, User } from 'lucide-react'
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog'

export function EmptyStateHero() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center animate-in fade-in duration-500">
      <div className="space-y-2 max-w-2xl">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Bem-vindo ao seu Estúdio de Vídeo IA</h1>
        <p className="text-xl text-muted-foreground">
          Você ainda não tem projetos. Crie vídeos profissionais a partir de apresentações, textos ou avatares em minutos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
        <Card className="border-muted/60 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">PPTX para Vídeo</h3>
              <p className="text-sm text-muted-foreground">Importe slides e gere narração automática.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted/60 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">Avatares IA</h3>
              <p className="text-sm text-muted-foreground">Avatares realistas que falam seu texto.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted/60 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <PlayCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">Editor Completo</h3>
              <p className="text-sm text-muted-foreground">Controle total na timeline.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <CreateProjectDialog 
          trigger={
            <Button size="lg" className="h-14 px-8 text-lg shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <PlayCircle className="mr-2 h-5 w-5" />
              Criar Primeiro Projeto Agora
            </Button>
          }
        />
        <p className="text-sm text-muted-foreground mt-4">
          Precisa de ajuda? Confira o <span className="underline decoration-dotted cursor-help" title="Clique no ícone de ajuda na barra lateral">Guia do Usuário</span> na barra lateral.
        </p>
      </div>
    </div>
  )
}
