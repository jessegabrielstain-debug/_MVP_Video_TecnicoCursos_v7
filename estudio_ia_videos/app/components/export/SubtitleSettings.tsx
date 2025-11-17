/**
 * 📝 Subtitle Settings Component
 * Configure subtitles for video export
 */

import { useState, useRef } from 'react'
import { SubtitleFormat, SubtitleStyle } from '@/types/subtitle.types'
import { SubtitleParser } from '@/lib/export/subtitle-parser'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  EyeOff,
  FileUp,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

interface SubtitleConfig {
  enabled: boolean
  source?: string // file path
  format?: SubtitleFormat
  burnIn: boolean
  style: SubtitleStyle
}

interface SubtitleSettingsProps {
  subtitle: SubtitleConfig | null
  onChange: (subtitle: SubtitleConfig | null) => void
}

const DEFAULT_STYLE: SubtitleStyle = {
  fontName: 'Arial',
  fontSize: 24,
  primaryColor: '#FFFFFF',
  outlineColor: '#000000',
  outline: 2,          // Changed from outlineWidth
  shadow: 1,           // Changed from shadowDepth
  bold: false,
  italic: false,
  underline: false,
  alignment: 2,        // Changed from 'center' to number (2 = bottom center)
  marginL: 10,
  marginR: 10,
  marginV: 20,
  secondaryColor: '#FFFFFF',
}

const TAB_VALUES = ['upload', 'style'] as const
type TabValue = (typeof TAB_VALUES)[number]

const tabValuesSet = new Set<string>(TAB_VALUES)

const isTabValue = (value: string): value is TabValue => tabValuesSet.has(value)

export function SubtitleSettings({ subtitle, onChange }: SubtitleSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>('')
  const [activeTab, setActiveTab] = useState<TabValue>('upload')

  /**
   * Handle file upload
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      const format = SubtitleParser.detectFormat(content)

      if (!format) {
        toast.error('Formato de legenda não reconhecido')
        return
      }

      // Parse to validate
      const parsed = SubtitleParser.parse(content, format)

      // Preview first 3 cues
      const previewText = parsed.cues
        .slice(0, 3)
        .map((cue) => `[${cue.startTime}s - ${cue.endTime}s] ${cue.text}`)
        .join('\n')

      setPreview(previewText)

      onChange({
        enabled: true,
        source: file.name, // In production, upload to storage
        format,
        burnIn: true,
        style: subtitle?.style || DEFAULT_STYLE,
      })

      toast.success(`Legenda carregada: ${format.toUpperCase()} (${parsed.cues.length} cues)`)
    } catch (error) {
      toast.error('Erro ao carregar legenda')
      console.error(error)
    }
  }

  /**
   * Remove subtitle
   */
  const removeSubtitle = () => {
    onChange(null)
    setPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Legenda removida')
  }

  /**
   * Update style
   */
  const updateStyle = (updates: Partial<SubtitleStyle>) => {
    if (!subtitle) return

    onChange({
      ...subtitle,
      style: { ...subtitle.style, ...updates },
    })
  }

  /**
   * Toggle burn-in
   */
  const toggleBurnIn = (burnIn: boolean) => {
    if (!subtitle) return
    onChange({ ...subtitle, burnIn })
  }

  /**
   * Apply preset style
   */
  const applyPreset = (preset: 'default' | 'yellow' | 'white-outline' | 'black-bg') => {
    const presets: Record<string, Partial<SubtitleStyle>> = {
      default: DEFAULT_STYLE,
      yellow: {
        primaryColor: '#FFFF00',
        outlineColor: '#000000',
        outline: 2,
        bold: true,
      },
      'white-outline': {
        primaryColor: '#FFFFFF',
        outlineColor: '#000000',
        outline: 3,
        shadow: 2,
        bold: true,
      },
      'black-bg': {
        primaryColor: '#FFFFFF',
        backColor: '#000000CC',
        outline: 0,
        shadow: 0,
      },
    }

    updateStyle(presets[preset])
    toast.success(`Preset aplicado: ${preset}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Legendas</h3>
        </div>
        {subtitle && (
          <Button variant="outline" size="sm" onClick={removeSubtitle}>
            <Trash2 className="h-4 w-4 mr-2" />
            Remover
          </Button>
        )}
      </div>

      {!subtitle ? (
        // Upload area
        <Card
          className="p-8 border-2 border-dashed cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-blue-100">
              <FileUp className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Carregar Arquivo de Legenda</h4>
              <p className="text-sm text-muted-foreground">
                Suporte para SRT, VTT e ASS
              </p>
            </div>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Escolher Arquivo
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".srt,.vtt,.ass"
            onChange={handleFileUpload}
            className="hidden"
          />
        </Card>
      ) : (
        // Subtitle configuration
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (isTabValue(value)) {
              setActiveTab(value)
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <FileText className="h-4 w-4 mr-2" />
              Arquivo
            </TabsTrigger>
            <TabsTrigger value="style">
              <Sparkles className="h-4 w-4 mr-2" />
              Estilo
            </TabsTrigger>
          </TabsList>

          {/* Tab: Arquivo */}
          <TabsContent value="upload" className="space-y-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{subtitle.source}</p>
                      <p className="text-sm text-muted-foreground">
                        {subtitle.format?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Trocar
                  </Button>
                </div>

                {preview && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <pre className="text-xs whitespace-pre-wrap">{preview}</pre>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Burn-in no vídeo</Label>
                    <p className="text-xs text-muted-foreground">
                      Incorporar legendas permanentemente
                    </p>
                  </div>
                  <Switch checked={subtitle.burnIn} onCheckedChange={toggleBurnIn} />
                </div>
              </div>
            </Card>

            <input
              ref={fileInputRef}
              type="file"
              accept=".srt,.vtt,.ass"
              onChange={handleFileUpload}
              className="hidden"
            />
          </TabsContent>

          {/* Tab: Estilo */}
          <TabsContent value="style" className="space-y-4">
            {/* Presets */}
            <div className="space-y-2">
              <Label>Presets de Estilo</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('default')}
                >
                  Padrão
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('yellow')}
                >
                  Amarelo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('white-outline')}
                >
                  Branco + Contorno
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('black-bg')}
                >
                  Fundo Preto
                </Button>
              </div>
            </div>

            {/* Font */}
            <div className="space-y-2">
              <Label>Fonte</Label>
              <Select
                value={subtitle.style.fontName}
                onValueChange={(fontName) => updateStyle({ fontName })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tamanho da Fonte</Label>
                <span className="text-sm text-muted-foreground">
                  {subtitle.style.fontSize}px
                </span>
              </div>
              <Slider
                value={[subtitle.style.fontSize]}
                onValueChange={([fontSize]) => updateStyle({ fontSize })}
                min={12}
                max={72}
                step={1}
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor do Texto</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={subtitle.style.primaryColor}
                    onChange={(e) => updateStyle({ primaryColor: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={subtitle.style.primaryColor}
                    onChange={(e) => updateStyle({ primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor do Contorno</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={subtitle.style.outlineColor || '#000000'}
                    onChange={(e) => updateStyle({ outlineColor: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={subtitle.style.outlineColor || '#000000'}
                    onChange={(e) => updateStyle({ outlineColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Outline Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Largura do Contorno</Label>
                <span className="text-sm text-muted-foreground">
                  {subtitle.style.outline}px
                </span>
              </div>
              <Slider
                value={[subtitle.style.outline || 0]}
                onValueChange={([outline]) => updateStyle({ outline })}
                min={0}
                max={5}
                step={1}
              />
            </div>

            {/* Shadow Depth */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Profundidade da Sombra</Label>
                <span className="text-sm text-muted-foreground">
                  {subtitle.style.shadow}px
                </span>
              </div>
              <Slider
                value={[subtitle.style.shadow || 0]}
                onValueChange={([shadow]) => updateStyle({ shadow })}
                min={0}
                max={5}
                step={1}
              />
            </div>

            {/* Alignment */}
            <div className="space-y-2">
              <Label>Alinhamento</Label>
              <Select
                value={String(subtitle.style.alignment || 2)}
                onValueChange={(value) => updateStyle({ alignment: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Inferior Esquerdo</SelectItem>
                  <SelectItem value="2">Inferior Centro</SelectItem>
                  <SelectItem value="3">Inferior Direito</SelectItem>
                  <SelectItem value="4">Centro Esquerdo</SelectItem>
                  <SelectItem value="5">Centro</SelectItem>
                  <SelectItem value="6">Centro Direito</SelectItem>
                  <SelectItem value="7">Superior Esquerdo</SelectItem>
                  <SelectItem value="8">Superior Centro</SelectItem>
                  <SelectItem value="9">Superior Direito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text Style */}
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={subtitle.style.bold}
                  onCheckedChange={(bold) => updateStyle({ bold })}
                  id="bold"
                />
                <Label htmlFor="bold" className="cursor-pointer">
                  Negrito
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={subtitle.style.italic}
                  onCheckedChange={(italic) => updateStyle({ italic })}
                  id="italic"
                />
                <Label htmlFor="italic" className="cursor-pointer">
                  Itálico
                </Label>
              </div>
            </div>

            {/* Preview */}
            <Card className="p-4 bg-black text-white text-center">
              <p
                style={{
                  fontFamily: subtitle.style.fontName,
                  fontSize: subtitle.style.fontSize,
                  color: subtitle.style.primaryColor,
                  fontWeight: subtitle.style.bold ? 'bold' : 'normal',
                  fontStyle: subtitle.style.italic ? 'italic' : 'normal',
                  textShadow: `
                    ${subtitle.style.outline}px ${subtitle.style.outline}px 0 ${subtitle.style.outlineColor},
                    -${subtitle.style.outline}px -${subtitle.style.outline}px 0 ${subtitle.style.outlineColor},
                    ${subtitle.style.outline}px -${subtitle.style.outline}px 0 ${subtitle.style.outlineColor},
                    -${subtitle.style.outline}px ${subtitle.style.outline}px 0 ${subtitle.style.outlineColor},
                    ${subtitle.style.shadow}px ${subtitle.style.shadow}px ${subtitle.style.shadow * 2}px rgba(0,0,0,0.5)
                  `,
                }}
              >
                Exemplo de Legenda
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Info card */}
      {subtitle && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="font-medium">
              Legenda {subtitle.burnIn ? 'incorporada' : 'separada'}
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
