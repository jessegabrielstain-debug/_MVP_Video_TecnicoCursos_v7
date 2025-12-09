'use client'

import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { NetflixRow } from './netflix-row'
import { Play, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VideoModal } from './video-modal'
import type { NRTemplate } from '@/lib/services/nr-templates-service'

export function BrowseView() {
  const [templates, setTemplates] = useState<NRTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<NRTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/nr-templates')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setTemplates(data)
      } catch (error) {
        logger.error('Failed to fetch templates', error instanceof Error ? error : new Error(String(error)), { component: 'BrowseView' })
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  const handleSelect = (item: { id: string }) => {
    const template = templates.find(t => t.id === item.id)
    if (template) {
      setSelectedTemplate(template)
      setIsModalOpen(true)
    }
  }

  const handleHeroPlay = () => {
    if (templates.length > 0) {
      setSelectedTemplate(templates[0])
      setIsModalOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Transform templates to Netflix items
  const nrItems = templates.map(t => ({
    id: t.id,
    title: `${t.nr_number} - ${t.title}`,
    image: '', // Placeholder
    duration: `${Math.floor(t.duration_seconds / 60)} min`,
    description: t.description || 'Sem descrição',
    match: 98,
    year: 2024,
    rating: 'L'
  }))

  const popularItems = [...nrItems].sort(() => 0.5 - Math.random()).slice(0, 5)
  const newItems = [...nrItems].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5)

  const featured = templates[0] ? {
    title: `${templates[0].nr_number} - ${templates[0].title}`,
    description: templates[0].description,
  } : {
    title: 'NR-35 Trabalho em Altura',
    description: 'Curso completo sobre segurança em trabalho em altura.',
  }

  return (
    <div className="relative min-h-screen bg-[#141414] text-white -m-6">
      {/* Hero Section */}
      <div className="relative h-[65vh] w-full">
        <div className="absolute inset-0">
          <div className="h-full w-full bg-gradient-to-r from-black via-black/50 to-transparent absolute z-10" />
          <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#141414] to-transparent z-10" />
        </div>

        <div className="absolute bottom-[20%] left-4 md:left-16 z-20 max-w-2xl space-y-4">
          <h1 className="text-2xl font-bold md:text-4xl lg:text-6xl text-shadow-md">
            {featured.title}
          </h1>
          <p className="text-sm md:text-lg text-shadow-md drop-shadow-lg line-clamp-3">
            {featured.description}
          </p>

          <div className="flex space-x-3 pt-4">
            <button 
                onClick={handleHeroPlay}
                className="flex items-center gap-x-2 rounded bg-white px-6 py-2 text-sm font-bold text-black transition hover:bg-[#e6e6e6] md:text-lg"
            >
              <Play className="h-5 w-5 fill-black" />
              Assistir
            </button>
            <button 
                onClick={handleHeroPlay}
                className="flex items-center gap-x-2 rounded bg-[gray]/70 px-6 py-2 text-sm font-bold text-white transition hover:bg-[gray]/40 md:text-lg"
            >
              <Info className="h-5 w-5" />
              Mais Info
            </button>
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="relative z-20 -mt-24 space-y-8 pl-4 pb-12 md:pl-16">
        <NetflixRow title="Normas Regulamentadoras" items={nrItems} onSelect={handleSelect} />
        <NetflixRow title="Em Alta" items={popularItems} onSelect={handleSelect} />
        <NetflixRow title="Adicionados Recentemente" items={newItems} onSelect={handleSelect} />
      </div>

      {/* Video Modal */}
      <VideoModal 
        template={selectedTemplate} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}
