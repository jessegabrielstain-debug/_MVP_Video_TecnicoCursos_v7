
/**
 * 🎨 NR Templates Gallery
 * 
 * Galeria visual de todos os templates NR disponíveis
 */

'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Clock, Award, BookOpen, Search, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

interface NRTemplate {
  id: string
  nr: string
  title: string
  description: string
  category: string
  duration: number
  thumbnailUrl: string
  certification: {
    validityMonths: number
    requiredScore: number
  }
  slides: any[]
}

export function NRTemplatesGallery() {
  const [templates, setTemplates] = useState<NRTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<NRTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [searchTerm, selectedCategory, templates])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/templates/nr')
      if (!response.ok) throw new Error('Erro ao buscar templates')
      
      const data = await response.json()
      setTemplates(data.templates || [])
      setFilteredTemplates(data.templates || [])
      setCategories(data.categories || [])
    } catch (error) {
      logger.error('Error fetching templates', error instanceof Error ? error : new Error(String(error)), { component: 'NRTemplatesGallery' })
      toast.error('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.nr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    setFilteredTemplates(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Templates NR Disponíveis</h2>
        <p className="text-muted-foreground">
          {templates.length} templates certificados para treinamentos de segurança do trabalho
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por NR, título ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Todas
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="relative w-full aspect-video mb-4 bg-muted rounded-lg overflow-hidden">
                <Image
                  src={template.thumbnailUrl}
                  alt={template.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-nr.jpg'
                  }}
                />
              </div>
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-primary">{template.nr}</Badge>
                <Badge variant="outline">{template.category}</Badge>
              </div>
              <CardTitle className="text-lg">{template.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{template.duration} minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span>{template.slides.length} slides</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span>Validade: {template.certification.validityMonths} meses</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button className="flex-1" size="sm">
                Usar Template
              </Button>
              <Button variant="outline" size="sm">
                Preview
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum template encontrado com os filtros selecionados
          </p>
        </div>
      )}
    </div>
  )
}
