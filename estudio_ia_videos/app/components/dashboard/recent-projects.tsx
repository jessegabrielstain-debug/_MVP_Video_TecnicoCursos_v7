
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, MoreVertical, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Image from 'next/image'
import { CardSkeleton } from '@/components/ui/skeleton-layouts'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  thumbnail?: string
  updatedAt: Date
  duration?: number
  status: 'draft' | 'completed' | 'processing'
}

interface RecentProjectsProps {
  loading?: boolean
  projects?: Project[]
}

export function RecentProjects({ loading, projects = [] }: RecentProjectsProps) {
  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Projetos Recentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Projetos Recentes</h2>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum projeto ainda</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro vídeo de treinamento
            </p>
            <Button asChild>
              <Link href="/editor-canvas" prefetch={false}>
                Criar Primeiro Vídeo
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Projetos Recentes</h2>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/projects">Ver todos</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.slice(0, 6).map((project) => (
          <Card key={project.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                {project.thumbnail ? (
                  <Image
                    src={project.thumbnail}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Button
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    asChild
                  >
                    <Link href={`/editor-canvas?project=${project.id}`} prefetch={false}>
                      <Play className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>

                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'completed' ? 'bg-green-500 text-white' :
                    project.status === 'processing' ? 'bg-blue-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    {project.status === 'completed' ? 'Completo' :
                     project.status === 'processing' ? 'Processando' : 'Rascunho'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium line-clamp-1 mb-2">{project.title}</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(project.updatedAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
