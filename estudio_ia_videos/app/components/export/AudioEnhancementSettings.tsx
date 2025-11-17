/**
 * 🔊 Audio Enhancement Settings Component
 * Configure audio processing and enhancements
 */

import { useState } from 'react'
import {
  AudioEnhancementType,
  AudioEnhancementConfig,
  AudioPreset,
  AudioProcessor,
  DEFAULT_ENHANCEMENT_VALUES,
} from '@/lib/export/audio-processor'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Volume2,
  Sparkles,
  Wand2,
  RotateCcw,
  Radio,
  Music,
  Mic,
  Settings,
} from 'lucide-react'

interface AudioEnhancementSettingsProps {
  enhancements: AudioEnhancementConfig[]
  onChange: (enhancements: AudioEnhancementConfig[]) => void
}

const TAB_VALUES = ['presets', 'custom'] as const
type TabValue = (typeof TAB_VALUES)[number]

const tabValuesSet = new Set<string>(TAB_VALUES)

const isTabValue = (value: string): value is TabValue => tabValuesSet.has(value)

export function AudioEnhancementSettings({
  enhancements,
  onChange,
}: AudioEnhancementSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('presets')

  /**
   * Apply preset
   */
  const applyPreset = (preset: AudioPreset) => {
    onChange(preset.enhancements)
  }

  /**
   * Update enhancement
   */
  const updateEnhancement = (index: number, updates: Partial<AudioEnhancementConfig>) => {
    const newEnhancements = [...enhancements]
    newEnhancements[index] = { ...newEnhancements[index], ...updates }
    onChange(newEnhancements)
  }

  /**
   * Add enhancement
   */
  const addEnhancement = (type: AudioEnhancementType) => {
    const newEnhancement = AudioProcessor.createEnhancement(
      type,
      DEFAULT_ENHANCEMENT_VALUES[type]
    )
    onChange([...enhancements, newEnhancement])
  }

  /**
   * Remove enhancement
   */
  const removeEnhancement = (index: number) => {
    onChange(enhancements.filter((_, i) => i !== index))
  }

  /**
   * Reset all
   */
  const resetEnhancements = () => {
    onChange([])
  }

  const presets = AudioProcessor.getPresets()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Processamento de Áudio</h3>
        </div>
        <Button variant="outline" size="sm" onClick={resetEnhancements}>
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
                className="p-4 cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => applyPreset(preset)}
              >
                <div className="space-y-2">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 rounded-md flex items-center justify-center">
                    {preset.id === 'podcast' && <Mic className="h-8 w-8 text-blue-400" />}
                    {preset.id === 'music' && <Music className="h-8 w-8 text-blue-400" />}
                    {preset.id === 'voice-clarity' && <Radio className="h-8 w-8 text-blue-400" />}
                    {preset.id === 'broadcast' && <Settings className="h-8 w-8 text-blue-400" />}
                  </div>
                  <h4 className="font-medium">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Volume2 className="h-3 w-3" />
                    {preset.enhancements.length} processamentos
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {/* Active Enhancements */}
          {enhancements.length > 0 && (
            <div className="space-y-3">
              {enhancements.map((enhancement, index) => (
                <EnhancementControl
                  key={index}
                  enhancement={enhancement}
                  onUpdate={(updates) => updateEnhancement(index, updates)}
                  onRemove={() => removeEnhancement(index)}
                />
              ))}
            </div>
          )}

          {/* Add Enhancement Buttons */}
          <div className="space-y-2">
            <Label>Adicionar Processamento</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addEnhancement(AudioEnhancementType.NORMALIZE)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Normalizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addEnhancement(AudioEnhancementType.COMPRESSION)}
              >
                <Radio className="h-4 w-4 mr-2" />
                Compressão
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addEnhancement(AudioEnhancementType.NOISE_REDUCTION)}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Redução Ruído
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addEnhancement(AudioEnhancementType.EQUALIZER)}
              >
                <Music className="h-4 w-4 mr-2" />
                Equalizador
              </Button>
            </div>
          </div>

          {enhancements.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              <Volume2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum processamento adicionado</p>
              <p className="text-sm mt-1">Clique nos botões acima para adicionar</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Active Preview */}
      {enhancements.length > 0 && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Processamentos ativos:</span>
            <span className="text-muted-foreground">
              {enhancements.filter((e) => e.enabled).length}
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}

/**
 * Individual enhancement control
 */
interface EnhancementControlProps {
  enhancement: AudioEnhancementConfig
  onUpdate: (updates: Partial<AudioEnhancementConfig>) => void
  onRemove: () => void
}

function EnhancementControl({ enhancement, onUpdate, onRemove }: EnhancementControlProps) {
  const getEnhancementName = (type: AudioEnhancementType): string => {
    const names: Record<AudioEnhancementType, string> = {
      [AudioEnhancementType.NORMALIZE]: 'Normalização',
      [AudioEnhancementType.COMPRESSION]: 'Compressão',
      [AudioEnhancementType.NOISE_REDUCTION]: 'Redução de Ruído',
      [AudioEnhancementType.FADE_IN]: 'Fade In',
      [AudioEnhancementType.FADE_OUT]: 'Fade Out',
      [AudioEnhancementType.EQUALIZER]: 'Equalizador',
      [AudioEnhancementType.BASS_BOOST]: 'Realce de Graves',
      [AudioEnhancementType.TREBLE_BOOST]: 'Realce de Agudos',
      [AudioEnhancementType.VOLUME]: 'Volume',
      [AudioEnhancementType.DUCKING]: 'Ducking',
    }
    return names[type]
  }

  const renderControl = () => {
    switch (enhancement.type) {
      case AudioEnhancementType.NORMALIZE:
        const normValue = enhancement.value as { targetLevel: number; method: string }
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Nível Alvo</Label>
              <span className="text-sm text-muted-foreground">{normValue.targetLevel} dB</span>
            </div>
            <Slider
              value={[normValue.targetLevel]}
              onValueChange={([targetLevel]) =>
                onUpdate({ value: { ...normValue, targetLevel } })
              }
              min={-30}
              max={-10}
              step={1}
            />
          </div>
        )

      case AudioEnhancementType.COMPRESSION:
        const compValue = enhancement.value as {
          threshold: number
          ratio: number
          attack: number
          release: number
        }
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Threshold</Label>
                <span className="text-sm text-muted-foreground">{compValue.threshold} dB</span>
              </div>
              <Slider
                value={[compValue.threshold]}
                onValueChange={([threshold]) => onUpdate({ value: { ...compValue, threshold } })}
                min={-40}
                max={0}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ratio</Label>
                <span className="text-sm text-muted-foreground">{compValue.ratio}:1</span>
              </div>
              <Slider
                value={[compValue.ratio]}
                onValueChange={([ratio]) => onUpdate({ value: { ...compValue, ratio } })}
                min={1}
                max={20}
                step={1}
              />
            </div>
          </div>
        )

      case AudioEnhancementType.NOISE_REDUCTION:
        const noiseValue = enhancement.value as { strength: number }
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Intensidade</Label>
              <span className="text-sm text-muted-foreground">
                {(noiseValue.strength * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[noiseValue.strength * 100]}
              onValueChange={([v]) => onUpdate({ value: { strength: v / 100 } })}
              min={0}
              max={100}
              step={1}
            />
          </div>
        )

      case AudioEnhancementType.EQUALIZER:
        const eqValue = enhancement.value as { bass: number; mid: number; treble: number }
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Graves (Bass)</Label>
                <span className="text-sm text-muted-foreground">{eqValue.bass} dB</span>
              </div>
              <Slider
                value={[eqValue.bass]}
                onValueChange={([bass]) => onUpdate({ value: { ...eqValue, bass } })}
                min={-20}
                max={20}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Médios (Mid)</Label>
                <span className="text-sm text-muted-foreground">{eqValue.mid} dB</span>
              </div>
              <Slider
                value={[eqValue.mid]}
                onValueChange={([mid]) => onUpdate({ value: { ...eqValue, mid } })}
                min={-20}
                max={20}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Agudos (Treble)</Label>
                <span className="text-sm text-muted-foreground">{eqValue.treble} dB</span>
              </div>
              <Slider
                value={[eqValue.treble]}
                onValueChange={([treble]) => onUpdate({ value: { ...eqValue, treble } })}
                min={-20}
                max={20}
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
            <Volume2 className="h-4 w-4" />
            <span className="font-medium">{getEnhancementName(enhancement.type)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={enhancement.enabled}
              onCheckedChange={(enabled) => onUpdate({ enabled })}
            />
            <Button variant="ghost" size="sm" onClick={onRemove}>
              ✕
            </Button>
          </div>
        </div>

        {enhancement.enabled && renderControl()}
      </div>
    </Card>
  )
}
