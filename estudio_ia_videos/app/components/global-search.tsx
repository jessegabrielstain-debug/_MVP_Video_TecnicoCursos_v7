
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Search, FileVideo, FolderOpen, Settings, BookOpen, TrendingUp, Users, Command, ArrowRight } from 'lucide-react'
import { cn } from '../lib/utils'

interface Project {
  id: string
  name: string
  updatedAt: string
  [key: string]: unknown
}

interface SearchResult {
  id: string
  type: 'project' | 'template' | 'page' | 'action'
  title: string
  description?: string
  path: string
  icon: React.ReactNode
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  // Atalho Cmd/Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Páginas e ações padrão
  const defaultActions: SearchResult[] = [
    {
      id: 'new-project',
      type: 'action',
      title: 'Novo Projeto',
      description: 'Criar um novo projeto de vídeo',
      path: '/projetos?create=true',
      icon: <FileVideo className="w-4 h-4" />
    },
    {
      id: 'projects',
      type: 'page',
      title: 'Projetos',
      description: 'Ver todos os projetos',
      path: '/projetos',
      icon: <FolderOpen className="w-4 h-4" />
    },
    {
      id: 'templates',
      type: 'page',
      title: 'Templates',
      description: 'Explorar templates de vídeo',
      path: '/templates',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      id: 'analytics',
      type: 'page',
      title: 'Analytics',
      description: 'Visualizar estatísticas e métricas',
      path: '/analytics',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: 'collaboration',
      type: 'page',
      title: 'Colaboração',
      description: 'Gerenciar equipe e compartilhamentos',
      path: '/collaboration',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'settings',
      type: 'page',
      title: 'Configurações',
      description: 'Ajustar preferências do sistema',
      path: '/settings',
      icon: <Settings className="w-4 h-4" />
    }
  ]

  // Buscar projetos
  const searchProjects = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(defaultActions)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        const projectResults: SearchResult[] = data.projects?.map((project: Project) => ({
          id: project.id,
          type: 'project' as const,
          title: project.name,
          description: `Atualizado em ${new Date(project.updatedAt).toLocaleDateString('pt-BR')}`,
          path: `/editor/${project.id}`,
          icon: <FileVideo className="w-4 h-4" />
        })) || []

        // Filtrar ações padrão que correspondem à busca
        const filteredActions = defaultActions.filter(action =>
          action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )

        setResults([...projectResults, ...filteredActions])
      } else {
        setResults(defaultActions)
      }
    } catch (error) {
      console.error('Erro ao buscar:', error)
      setResults(defaultActions)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProjects(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchProjects])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Navegação por teclado
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + results.length) % results.length)
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleSelect(results[selectedIndex])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex])

  const handleSelect = (result: SearchResult) => {
    router.push(result.path)
    setOpen(false)
  }

  return (
    <>
      {/* Botão de busca na navbar */}
      <Button
        variant="outline"
        className="relative w-full sm:w-64 justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden md:inline-flex">Buscar...</span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs"><Command className="w-3 h-3" /></span>K
        </kbd>
      </Button>

      {/* Dialog de busca */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <div className="flex items-center border-b px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Buscar projetos, páginas, ações..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {loading && (
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full ml-2" />
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      {result.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{result.title}</div>
                      {result.description && (
                        <div className="text-xs text-muted-foreground">
                          {result.description}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-50" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Use ↑↓ para navegar, Enter para selecionar</span>
              <span>ESC para fechar</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
