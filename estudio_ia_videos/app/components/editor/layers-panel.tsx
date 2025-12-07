'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  Type,
  Image,
  Video,
  Volume2,
  Square,
  User,
  Plus,
  Layers,
  GripVertical
} from 'lucide-react'
import { EditorLayer, EditorElement } from '@/types/editor'

interface LayersPanelProps {
  layers: EditorLayer[];
  elements: EditorElement[];
  selectedElementId: string | null;
  onSelectElement: (elementId: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<EditorElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  onCreateLayer: (name?: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<EditorLayer>) => void;
}

export function LayersPanel({
  layers,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onCreateLayer,
  onUpdateLayer,
}: LayersPanelProps) {
  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-3 w-3" />
      case 'image': return <Image className="h-3 w-3" />
      case 'video': return <Video className="h-3 w-3" />
      case 'audio': return <Volume2 className="h-3 w-3" />
      case 'shape': return <Square className="h-3 w-3" />
      case 'avatar': return <User className="h-3 w-3" />
      default: return <Square className="h-3 w-3" />
    }
  }

  const getLayerElements = (layerId: string) => {
    return elements.filter(element => element.layerId === layerId);
  };

  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    e.dataTransfer.setData('text/plain', elementId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault()
    const elementId = e.dataTransfer.getData('text/plain')
    onUpdateElement(elementId, { layerId: targetLayerId })
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <CardTitle className="text-sm">Layers</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateLayer()}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-3">
            {layers.map((layer, layerIndex) => {
              const layerElements = getLayerElements(layer.id)
              
              return (
                <div key={layer.id} className="space-y-1">
                  {/* Layer Header */}
                  <div 
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 group"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, layer.id)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => onUpdateLayer(layer.id, { 
                        expanded: !layer.expanded 
                      })}
                    >
                      {layer.expanded ? 
                        <ChevronDown className="h-3 w-3" /> : 
                        <ChevronRight className="h-3 w-3" />
                      }
                    </Button>
                    
                    <div className="flex-1 flex items-center space-x-2">
                      <Input
                        value={layer.name}
                        onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                        className="h-6 text-xs border-none bg-transparent p-0 focus-visible:ring-0"
                        onFocus={(e) => e.target.select()}
                      />
                      <Badge variant="outline" className="text-xs">
                        {layerElements.length}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onUpdateLayer(layer.id, { 
                          visible: !layer.visible 
                        })}
                      >
                        {layer.visible ? 
                          <Eye className="h-3 w-3" /> : 
                          <EyeOff className="h-3 w-3" />
                        }
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onUpdateLayer(layer.id, { 
                          locked: !layer.locked 
                        })}
                      >
                        {layer.locked ? 
                          <Lock className="h-3 w-3" /> : 
                          <Unlock className="h-3 w-3" />
                        }
                      </Button>
                    </div>
                  </div>
                  
                  {/* Layer Elements */}
                  {layer.expanded && (
                    <div className="ml-6 space-y-1">
                      {layerElements.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-2 text-center">
                          No elements in this layer
                        </div>
                      ) : (
                        layerElements.map((element) => (
                          <div
                            key={element.id}
                            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer group transition-colors ${
                              selectedElementId === element.id
                                ? 'bg-blue-100 border border-blue-300'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => onSelectElement(element.id)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, element.id)}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                            
                            <div className="flex items-center space-x-2 flex-1">
                              {getElementIcon(element.type)}
                              <span className="text-xs truncate">
                                {element.name || `${element.type} ${element.id.slice(-4)}`}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onUpdateElement(element.id, { 
                                    visible: !element.visible 
                                  })
                                }}
                              >
                                {element.visible !== false ? 
                                  <Eye className="h-2.5 w-2.5" /> : 
                                  <EyeOff className="h-2.5 w-2.5" />
                                }
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onUpdateElement(element.id, { 
                                    locked: !element.locked 
                                  })
                                }}
                              >
                                {element.locked ? 
                                  <Lock className="h-2.5 w-2.5" /> : 
                                  <Unlock className="h-2.5 w-2.5" />
                                }
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDuplicateElement(element.id)
                                }}
                              >
                                <Copy className="h-2.5 w-2.5" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteElement(element.id)
                                }}
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            
            {layers.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No layers yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onCreateLayer()}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Layer
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Layer Controls */}
        <div className="border-t p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{layers.length} layers</span>
            <span>{elements.length} elements</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}