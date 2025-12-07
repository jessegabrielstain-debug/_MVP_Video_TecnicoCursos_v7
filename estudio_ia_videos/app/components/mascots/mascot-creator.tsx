

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ColorPicker } from '../ui/color-picker'
import { 
  Sparkles, 
  Wand2, 
  Building, 
  Palette,
  Upload,
  Download,
  Share2,
  Crown,
  Heart
} from 'lucide-react'
import { MascotSystem, MascotTemplate, MascotCustomization } from '../../lib/mascots/mascot-system'
import Image from 'next/image'

type PersonalityStyleOption = MascotCustomization['personality']['style']

const PERSONALITY_STYLE_OPTIONS: ReadonlyArray<{ value: PersonalityStyleOption; label: string }> = [
  { value: 'profissional', label: '👔 Profissional' },
  { value: 'descontraido', label: '😊 Descontraído' },
  { value: 'energetico', label: '⚡ Energético' },
  { value: 'calmo', label: '🧘 Calmo' }
]

const isPersonalityStyleOption = (value: string): value is PersonalityStyleOption =>
  PERSONALITY_STYLE_OPTIONS.some(option => option.value === value)

interface MascotCreatorProps {
  onMascotCreate: (mascot: MascotTemplate, customization: MascotCustomization) => void
  companyBranding?: {
    name: string
    colors: string[]
    industry: string
  }
}

export default function MascotCreator({ onMascotCreate, companyBranding }: MascotCreatorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MascotTemplate | null>(null)
  const [customization, setCustomization] = useState<MascotCustomization>({
    template_id: '',
    company_branding: {
      primary_color: companyBranding?.colors[0] || '#0066CC',
      secondary_color: companyBranding?.colors[1] || '#FFFFFF',
      logo_integration: true,
      company_name: companyBranding?.name || ''
    },
    personality: {
      name: '',
      style: 'profissional',
      interaction_level: 'medio'
    },
    visual_customization: {
      animation_speed: 'normal'
    }
  })
  const [generatingCustom, setGeneratingCustom] = useState(false)
  const [templates, setTemplates] = useState<MascotTemplate[]>([])

  useEffect(() => {
    setTemplates(MascotSystem.MASCOT_TEMPLATES)
  }, [])

  const handleTemplateSelect = (template: MascotTemplate) => {
    setSelectedTemplate(template)
    setCustomization(prev => ({
      ...prev,
      template_id: template.id
    }))
  }

  const handleGenerateCustomMascot = async () => {
    if (!companyBranding) return
    
    setGeneratingCustom(true)
    
    try {
      const customMascot = await MascotSystem.generateCustomMascot({
        industry: companyBranding.industry,
        company_values: ['inovacao', 'seguranca', 'qualidade'],
        target_audience: 'funcionarios_treinamento',
        brand_colors: companyBranding.colors,
        style_preference: 'professional_friendly'
      })
      
      setSelectedTemplate(customMascot)
      setCustomization(prev => ({
        ...prev,
        template_id: customMascot.id
      }))
    } catch (error: unknown) {
      console.error('Erro ao gerar mascote:', error)
    } finally {
      setGeneratingCustom(false)
    }
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Criador de Mascotes Empresariais
          </h3>
          <p className="text-sm text-muted-foreground">
            Crie um mascote personalizado para representar sua empresa nos treinamentos
          </p>
        </div>
        
        <Button 
          onClick={handleGenerateCustomMascot}
          disabled={generatingCustom || !companyBranding}
          className="flex items-center gap-2"
        >
          <Wand2 className={`h-4 w-4 ${generatingCustom ? 'animate-spin' : ''}`} />
          {generatingCustom ? 'Gerando...' : 'IA Personalizada'}
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="customize">Personalizar</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                    {template.premium && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <CardDescription className="text-xs">
                    {template.type} • {template.industry}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Mascot Preview Placeholder */}
                  <div className="relative aspect-square bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg mb-3 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-purple-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs">
                      <strong>Estilo:</strong> {template.base_design.style}
                    </div>
                    <div className="text-xs">
                      <strong>Personalidade:</strong> {template.personality_traits.slice(0, 2).join(', ')}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.base_design.colors.map((color, index) => (
                        <div 
                          key={index}
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="customize" className="space-y-6">
          {selectedTemplate ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Branding da Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building className="h-4 w-4" />
                    Branding Empresarial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome da Empresa</label>
                    <Input 
                      value={customization.company_branding.company_name}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        company_branding: { ...prev.company_branding, company_name: e.target.value }
                      }))}
                      placeholder="Digite o nome da empresa"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cor Primária</label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: customization.company_branding.primary_color }}
                        />
                        <Input 
                          type="color" 
                          value={customization.company_branding.primary_color}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            company_branding: { ...prev.company_branding, primary_color: e.target.value }
                          }))}
                          className="w-20"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cor Secundária</label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: customization.company_branding.secondary_color }}
                        />
                        <Input 
                          type="color" 
                          value={customization.company_branding.secondary_color}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            company_branding: { ...prev.company_branding, secondary_color: e.target.value }
                          }))}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personalidade */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" />
                    Personalidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome do Mascote</label>
                    <Input 
                      value={customization.personality.name}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        personality: { ...prev.personality, name: e.target.value }
                      }))}
                      placeholder="Ex: Zé Segurança, Roberta Tech..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Frase Característica</label>
                    <Input 
                      value={customization.personality.catchphrase || ''}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        personality: { ...prev.personality, catchphrase: e.target.value }
                      }))}
                      placeholder="Ex: 'Segurança em primeiro lugar!'"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estilo de Interação</label>
                    <Select 
                      value={customization.personality.style}
                      onValueChange={(value) => {
                        if (!isPersonalityStyleOption(value)) {
                          return
                        }

                        setCustomization(prev => ({
                          ...prev,
                          personality: { ...prev.personality, style: value }
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERSONALITY_STYLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Selecione um template para personalizar</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-6">
          {selectedTemplate && customization.personality.name ? (
            <Card>
              <CardHeader>
                <CardTitle>Preview: {customization.personality.name}</CardTitle>
                <CardDescription>
                  {selectedTemplate.name} personalizado para {customization.company_branding.company_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preview Visual */}
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div 
                    className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold"
                    style={{ 
                      backgroundColor: customization.company_branding.primary_color,
                      border: `4px solid ${customization.company_branding.secondary_color}`
                    }}
                  >
                    {customization.personality.name.charAt(0)}
                  </div>
                  
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded px-3 py-1">
                    <p className="text-sm font-medium">{customization.personality.name}</p>
                    <p className="text-xs text-muted-foreground">{customization.personality.catchphrase}</p>
                  </div>
                </div>
                
                {/* Informações do Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Características</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Estilo: {customization.personality.style}</p>
                      <p>• Interação: {customization.personality.interaction_level}</p>
                      <p>• Animação: {customization.visual_customization.animation_speed}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Branding</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Empresa: {customization.company_branding.company_name}</p>
                      <p>• Cores: Personalizada</p>
                      <p>• Logo: {customization.company_branding.logo_integration ? 'Integrado' : 'Não'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Ações do Preview */}
                <div className="flex gap-2">
                  <Button onClick={handleFinalizeMascot} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Criar Mascote
                  </Button>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Configure seu mascote para ver o preview</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )

  function handleFinalizeMascot() {
    if (selectedTemplate) {
      onMascotCreate(selectedTemplate, customization)
    }
  }
}

