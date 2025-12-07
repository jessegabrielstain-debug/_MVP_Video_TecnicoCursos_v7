/**
 * 🎨 Video Filters Settings Component
 * Configure visual effects and filters
 */

import { useState } from 'react'
import {
  VideoFilterType,
  VideoFilterConfig,
  FilterPreset,
  FILTER_PRESETS,
} from '@/lib/export/video-filters-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Palette,
  Sparkles,
  Wand2,
  RotateCcw,
  Sun,
  Contrast as ContrastIcon,
  Droplet,
  Wind,
  Aperture as BlurIcon,
  Focus,
  ImageIcon,
} from 'lucide-react'

interface VideoFiltersSettingsProps {
  filters: VideoFilterConfig[]
  onChange: (filters: VideoFilterConfig[]) => void
}

const TAB_VALUES = ['presets', 'custom'] as const
type TabValue = (typeof TAB_VALUES)[number]

const tabValuesSet = new Set<string>(TAB_VALUES)

const isTabValue = (value: string): value is TabValue => tabValuesSet.has(value)

const getDefaultFilterValue = (type: VideoFilterType): VideoFilterConfig['value'] => {
  switch (type) {
    case VideoFilterType.BRIGHTNESS:
    case VideoFilterType.CONTRAST:
      return 0
    case VideoFilterType.SATURATION:
      return 1
    case VideoFilterType.BLUR:
    case VideoFilterType.SHARPEN:
      return 0
    case VideoFilterType.VIGNETTE:
      return { angle: 90, intensity: 0.5 }
    default:
      return 0
  }
}

const isNumberValue = (value: VideoFilterConfig['value']): value is number =>
  typeof value === 'number'

const isVignetteValue = (
  value: VideoFilterConfig['value'],
): value is { angle: number; intensity: number } => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.angle === 'number' && typeof record.intensity === 'number'
}

export function VideoFiltersSettings({ filters, onChange }: VideoFiltersSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('presets')

  /**
   * Apply preset filters
   */
  const applyPreset = (preset: FilterPreset) => {
    onChange(preset.filters)
  }

  /**
   * Update single filter
   */
  const updateFilter = (index: number, updates: Partial<VideoFilterConfig>) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], ...updates }
    onChange(newFilters)
  }

  /**
   * Add new filter
   */
  const addFilter = (type: VideoFilterType) => {
    const newFilter: VideoFilterConfig = {
      type,
      value: getDefaultFilterValue(type),
      enabled: true,
    }
    onChange([...filters, newFilter])
  }

  /**
   * Remove filter
   */
  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index))
  }

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    onChange([])
  }

  /**
   * Get presets
   */
  const presets = FILTER_PRESETS

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Filtros de Vídeo</h3>
        </div>
        <Button variant="outline" size="sm" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isTabValue(value)) {
            setActiveTab(value)
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presets">
            <Sparkles className="h-4 w-4 mr-2" />
            Presets
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Wand2 className="h-4 w-4 mr-2" />
            Personalizado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {presets.map((preset) => (
              <Card
                key={preset.id}
                className="p-4 cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => applyPreset(preset)}
              >
                <div className="space-y-2">
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-md flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-purple-400" />
                  </div>
                  <h4 className="font-medium">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Palette className="h-3 w-3" />
                    {preset.filters.length} filtros
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {/* Active Filters */}
          {filters.length > 0 && (
            <div className="space-y-3">
              {filters.map((filter, index) => (
                <FilterControl
                  key={index}
                  filter={filter}
                  onUpdate={(updates) => updateFilter(index, updates)}
                  onRemove={() => removeFilter(index)}
                />
              ))}
            </div>
          )}

          {/* Add Filter Buttons */}
          <div className="space-y-2">
            <Label>Adicionar Filtro</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFilter(VideoFilterType.BRIGHTNESS)}
              >
                <Sun className="h-4 w-4 mr-2" />
                Brilho
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFilter(VideoFilterType.CONTRAST)}
              >
                <ContrastIcon className="h-4 w-4 mr-2" />
                Contraste
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFilter(VideoFilterType.SATURATION)}
              >
                <Droplet className="h-4 w-4 mr-2" />
                Saturação
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFilter(VideoFilterType.BLUR)}
              >
                <BlurIcon className="h-4 w-4 mr-2" />
                Desfoque
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFilter(VideoFilterType.SHARPEN)}
              >
                <Focus className="h-4 w-4 mr-2" />
                Nitidez
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFilter(VideoFilterType.VIGNETTE)}
              >
                <Wind className="h-4 w-4 mr-2" />
                Vinheta
              </Button>
            </div>
          </div>

          {filters.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum filtro adicionado</p>
              <p className="text-sm mt-1">Clique nos botões acima para adicionar filtros</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Active Filters Preview */}
      {filters.length > 0 && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="font-medium">Filtros ativos:</span>
            <span className="text-muted-foreground">{filters.filter((f) => f.enabled).length}</span>
          </div>
        </Card>
      )}
    </div>
  )
}

/**
 * Individual filter control component
 */
interface FilterControlProps {
  filter: VideoFilterConfig
  onUpdate: (updates: Partial<VideoFilterConfig>) => void
  onRemove: () => void
}

function FilterControl({ filter, onUpdate, onRemove }: FilterControlProps) {
  const getFilterIcon = (type: VideoFilterType) => {
    switch (type) {
      case VideoFilterType.BRIGHTNESS:
        return <Sun className="h-4 w-4" />
      case VideoFilterType.CONTRAST:
        return <ContrastIcon className="h-4 w-4" />
      case VideoFilterType.SATURATION:
        return <Droplet className="h-4 w-4" />
      case VideoFilterType.BLUR:
        return <BlurIcon className="h-4 w-4" />
      case VideoFilterType.SHARPEN:
        return <Focus className="h-4 w-4" />
      case VideoFilterType.VIGNETTE:
        return <Wind className="h-4 w-4" />
      default:
        return <Palette className="h-4 w-4" />
    }
  }

  const getFilterName = (type: VideoFilterType): string => {
    const names: Record<VideoFilterType, string> = {
      [VideoFilterType.BRIGHTNESS]: 'Brilho',
      [VideoFilterType.CONTRAST]: 'Contraste',
      [VideoFilterType.SATURATION]: 'Saturação',
      [VideoFilterType.HUE]: 'Matiz',
      [VideoFilterType.BLUR]: 'Desfoque',
      [VideoFilterType.SHARPEN]: 'Nitidez',
      [VideoFilterType.SEPIA]: 'Sépia',
      [VideoFilterType.GRAYSCALE]: 'Preto e Branco',
      [VideoFilterType.VIGNETTE]: 'Vinheta',
      [VideoFilterType.FADE]: 'Fade',
      [VideoFilterType.COLORIZE]: 'Colorização',
      [VideoFilterType.NOISE]: 'Ruído',
      [VideoFilterType.DENOISE]: 'Redução de Ruído',
    }
    return names[type]
  }

  const renderFilterControl = () => {
    switch (filter.type) {
      case VideoFilterType.BRIGHTNESS:
      case VideoFilterType.CONTRAST:
        if (!isNumberValue(filter.value)) {
          return null
        }
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Intensidade</Label>
              <span className="text-sm text-muted-foreground">
                {(filter.value * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[filter.value * 100]}
              onValueChange={([v]) => onUpdate({ value: v / 100 })}
              min={-100}
              max={100}
              step={1}
            />
          </div>
        )

      case VideoFilterType.SATURATION:
        if (!isNumberValue(filter.value)) {
          return null
        }
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Saturação</Label>
              <span className="text-sm text-muted-foreground">
                {(filter.value * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[filter.value * 100]}
              onValueChange={([v]) => onUpdate({ value: v / 100 })}
              min={0}
              max={300}
              step={1}
            />
          </div>
        )

      case VideoFilterType.BLUR:
        if (!isNumberValue(filter.value)) {
          return null
        }
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Raio</Label>
              <span className="text-sm text-muted-foreground">{filter.value}px</span>
            </div>
            <Slider
              value={[filter.value]}
              onValueChange={([v]) => onUpdate({ value: v })}
              min={0}
              max={20}
              step={1}
            />
          </div>
        )

      case VideoFilterType.SHARPEN:
        if (!isNumberValue(filter.value)) {
          return null
        }
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Intensidade</Label>
              <span className="text-sm text-muted-foreground">
                {(filter.value * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[filter.value * 100]}
              onValueChange={([v]) => onUpdate({ value: v / 100 })}
              min={0}
              max={200}
              step={1}
            />
          </div>
        )

      case VideoFilterType.VIGNETTE:
        if (!isVignetteValue(filter.value)) {
          return null
        }
        const vignetteValue = filter.value
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ângulo</Label>
                <span className="text-sm text-muted-foreground">{vignetteValue.angle}°</span>
              </div>
              <Slider
                value={[vignetteValue.angle]}
                onValueChange={([angle]) =>
                  onUpdate({ value: { ...vignetteValue, angle } })
                }
                min={0}
                max={180}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Intensidade</Label>
                <span className="text-sm text-muted-foreground">
                  {(vignetteValue.intensity * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[vignetteValue.intensity * 100]}
                onValueChange={([v]) =>
                  onUpdate({ value: { ...vignetteValue, intensity: v / 100 } })
                }
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFilterIcon(filter.type)}
            <span className="font-medium">{getFilterName(filter.type)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={filter.enabled} onCheckedChange={(enabled) => onUpdate({ enabled })} />
            <Button variant="ghost" size="sm" onClick={onRemove}>
              ✕
            </Button>
          </div>
        </div>

        {filter.enabled && renderFilterControl()}
      </div>
    </Card>
  )
}
