'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Type, 
  Image, 
  Video, 
  Volume2, 
  Square, 
  User, 
  Palette, 
  Move, 
  RotateCw, 
  Eye,
  Lock,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react'
import { HeyGenVoiceSelector } from './heygen-voice-selector'

// Flexible element interface for the properties panel
// This accepts both the strict EditorElement and the looser TimelineElement
export interface FlexibleElement {
  id: string
  name: string
  type: string
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  opacity?: number
  visible?: boolean
  locked?: boolean
  content?: string
  src?: string
  style?: Record<string, unknown>
  metadata?: Record<string, unknown>
  animation?: {
    type?: string
    duration?: number
    delay?: number
    easing?: string
  }
  [key: string]: unknown
}

interface PropertiesPanelProps {
  selectedElement: FlexibleElement | null
  onUpdateElement: (elementId: string, updates: Partial<FlexibleElement>) => void
  onDeleteElement: (elementId: string) => void
  onDuplicateElement: (elementId: string) => void
}

export function PropertiesPanel({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
}: PropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Square className="h-8 w-8 mb-2" />
            <p className="text-sm">Select an element to edit properties</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const updateProperty = (property: string, value: any) => {
    onUpdateElement(selectedElement.id, { [property]: value })
  }

  const updateStyle = (property: string, value: any) => {
    onUpdateElement(selectedElement.id, {
      style: { ...selectedElement.style, [property]: value }
    })
  }

  const getElementIcon = () => {
    switch (selectedElement.type) {
      case 'text': return <Type className="h-4 w-4" />
      case 'image': return <Image className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Volume2 className="h-4 w-4" />
      case 'shape': return <Square className="h-4 w-4" />
      case 'avatar': return <User className="h-4 w-4" />
      default: return <Square className="h-4 w-4" />
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getElementIcon()}
            <CardTitle className="text-sm capitalize">{selectedElement.type}</CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicateElement(selectedElement.id)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteElement(selectedElement.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="animation">Animation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            {/* Element Name */}
            <div className="space-y-2">
              <Label htmlFor="element-name">Name</Label>
              <Input
                id="element-name"
                value={selectedElement.name}
                onChange={(e) => updateProperty('name', e.target.value)}
                placeholder="Element name"
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label>Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="pos-x" className="text-xs">X</Label>
                  <Input
                    id="pos-x"
                    type="number"
                    value={selectedElement.x || 0}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      x: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="pos-y" className="text-xs">Y</Label>
                  <Input
                    id="pos-y"
                    type="number"
                    value={selectedElement.y || 0}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      y: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label>Size</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width" className="text-xs">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={selectedElement.width || 100}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      width: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-xs">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={selectedElement.height || 100}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      height: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <Label htmlFor="rotation">Rotation</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[selectedElement.rotation || 0]}
                  onValueChange={(value) => updateProperty('rotation', value[0])}
                  max={360}
                  min={0}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm w-12">{selectedElement.rotation || 0}°</span>
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <Label htmlFor="opacity">Opacity</Label>
              <div className="flex items-center space-x-2">
                <Slider
                  value={[selectedElement.opacity || 1]}
                  onValueChange={(value) => updateProperty('opacity', value[0])}
                  max={1}
                  min={0}
                  step={0.01}
                  className="flex-1"
                />
                <span className="text-sm w-12">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
              </div>
            </div>

            {/* Visibility and Lock */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedElement.visible !== false}
                  onCheckedChange={(checked) => updateProperty('visible', checked)}
                />
                <Label className="text-sm">Visible</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedElement.locked || false}
                  onCheckedChange={(checked) => updateProperty('locked', checked)}
                />
                <Label className="text-sm">Locked</Label>
              </div>
            </div>

            {/* Type-specific properties */}
            {selectedElement.type === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="text-content">Text Content</Label>
                <Textarea
                  id="text-content"
                  value={selectedElement.content || ''}
                  onChange={(e) => updateProperty('content', e.target.value)}
                  placeholder="Enter text content"
                  rows={3}
                />
              </div>
            )}

            {selectedElement.type === 'avatar' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Avatar Settings</Label>
                  <div className="text-xs text-muted-foreground">
                    {String(selectedElement.metadata?.avatarName || 'Unknown Avatar')}
                  </div>
                </div>
                
                {selectedElement.metadata?.engine === 'heygen' && (
                  <div className="space-y-2">
                    <Label htmlFor="heygen-voice">HeyGen Voice</Label>
                    <HeyGenVoiceSelector 
                      value={String(selectedElement.metadata?.voiceId || '')}
                      onChange={(voiceId) => onUpdateElement(selectedElement.id, {
                        metadata: { ...selectedElement.metadata, voiceId }
                      })}
                    />
                  </div>
                )}
              </div>
            )}

            {(selectedElement.type === 'image' || selectedElement.type === 'video') && (
              <div className="space-y-2">
                <Label htmlFor="source">Source URL</Label>
                <Input
                  id="source"
                  value={selectedElement.src || ''}
                  onChange={(e) => updateProperty('src', e.target.value)}
                  placeholder="Enter URL or file path"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="style" className="space-y-4">
            {/* Background Color */}
            <div className="space-y-2">
              <Label htmlFor="bg-color">Background Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="bg-color"
                  type="color"
                  value={String(selectedElement.style?.backgroundColor || '#ffffff')}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <Input
                  value={String(selectedElement.style?.backgroundColor || '#ffffff')}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Border */}
            <div className="space-y-2">
              <Label>Border</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="border-width" className="text-xs">Width</Label>
                  <Input
                    id="border-width"
                    type="number"
                    value={Number(selectedElement.style?.borderWidth || 0)}
                    onChange={(e) => updateStyle('borderWidth', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="border-color" className="text-xs">Color</Label>
                  <Input
                    id="border-color"
                    type="color"
                    value={String(selectedElement.style?.borderColor || '#000000')}
                    onChange={(e) => updateStyle('borderColor', e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label htmlFor="border-radius">Border Radius</Label>
              <Input
                id="border-radius"
                type="number"
                value={Number(selectedElement.style?.borderRadius || 0)}
                onChange={(e) => updateStyle('borderRadius', Number(e.target.value))}
              />
            </div>

            {/* Text-specific styles */}
            {selectedElement.type === 'text' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Text Style</Label>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant={selectedElement.style?.fontWeight === 'bold' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStyle('fontWeight', 
                        selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold'
                      )}
                    >
                      <Bold className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={selectedElement.style?.fontStyle === 'italic' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStyle('fontStyle', 
                        selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic'
                      )}
                    >
                      <Italic className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={selectedElement.style?.textDecoration === 'underline' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStyle('textDecoration', 
                        selectedElement.style?.textDecoration === 'underline' ? 'none' : 'underline'
                      )}
                    >
                      <Underline className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Input
                    id="font-size"
                    type="number"
                    value={Number(selectedElement.style?.fontSize || 16)}
                    onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={String(selectedElement.style?.color || '#000000')}
                      onChange={(e) => updateStyle('color', e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      value={String(selectedElement.style?.color || '#000000')}
                      onChange={(e) => updateStyle('color', e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Text Alignment</Label>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant={selectedElement.style?.textAlign === 'left' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStyle('textAlign', 'left')}
                    >
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={selectedElement.style?.textAlign === 'center' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStyle('textAlign', 'center')}
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={selectedElement.style?.textAlign === 'right' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStyle('textAlign', 'right')}
                    >
                      <AlignRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="animation" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="animation-type">Animation Type</Label>
              <Select
                value={selectedElement.animation?.type || 'none'}
                onValueChange={(value) => updateProperty('animation', { 
                  ...selectedElement.animation, 
                  type: value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select animation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="fadeIn">Fade In</SelectItem>
                  <SelectItem value="fadeOut">Fade Out</SelectItem>
                  <SelectItem value="slideIn">Slide In</SelectItem>
                  <SelectItem value="slideOut">Slide Out</SelectItem>
                  <SelectItem value="scaleIn">Scale In</SelectItem>
                  <SelectItem value="scaleOut">Scale Out</SelectItem>
                  <SelectItem value="rotateIn">Rotate In</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedElement.animation?.type && selectedElement.animation.type !== 'none' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="animation-duration">Duration (seconds)</Label>
                  <Input
                    id="animation-duration"
                    type="number"
                    step="0.1"
                    value={selectedElement.animation?.duration || 1}
                    onChange={(e) => updateProperty('animation', { 
                      ...selectedElement.animation, 
                      duration: Number(e.target.value) 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="animation-delay">Delay (seconds)</Label>
                  <Input
                    id="animation-delay"
                    type="number"
                    step="0.1"
                    value={selectedElement.animation?.delay || 0}
                    onChange={(e) => updateProperty('animation', { 
                      ...selectedElement.animation, 
                      delay: Number(e.target.value) 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="animation-easing">Easing</Label>
                  <Select
                    value={selectedElement.animation?.easing || 'ease'}
                    onValueChange={(value) => updateProperty('animation', { 
                      ...selectedElement.animation, 
                      easing: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select easing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ease">Ease</SelectItem>
                      <SelectItem value="ease-in">Ease In</SelectItem>
                      <SelectItem value="ease-out">Ease Out</SelectItem>
                      <SelectItem value="ease-in-out">Ease In Out</SelectItem>
                      <SelectItem value="linear">Linear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}